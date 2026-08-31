package pro.damjan.belabackend.user.presence.session;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SessionServiceTest {

    private SessionRepository sessionRepository;
    private SessionService sessionService;

    @BeforeEach
    void setUp() {
        sessionRepository = mock(SessionRepository.class);
        sessionService = new SessionService(sessionRepository);

        // Redis assigns the id on save; the tests below hand back what they were given so the
        // service sees the same object it built.
        when(sessionRepository.save(any(UserSession.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void aNewSessionIsStampedAndStartsWithoutTheSeat() {
        Instant before = Instant.now();

        UserSession created = sessionService.createSession("user-id", new SessionMetadata("agent", "1.2.3.4"));

        assertThat(created.getUserId()).isEqualTo("user-id");
        assertThat(created.isActive()).isFalse();
        assertThat(created.getCreatedAt()).isBetween(before, Instant.now());
    }

    @Test
    void theNewestActiveSessionIsTheOneHoldingTheSeat() {
        // Two look active — which is what a pair of handshakes landing together can leave behind.
        // The takeover rule is the newest wins, so reading has to agree with writing.
        Instant now = Instant.now();
        givenSessions(
                session("old", true, now.minusSeconds(60)),
                session("new", true, now),
                session("idle", false, now.plusSeconds(60))
        );

        assertThat(sessionService.getActiveSession("user-id").getId()).isEqualTo("new");
        assertThat(sessionService.userHasActiveSession("user-id")).isTrue();
    }

    @Test
    void aUserWithNoSessionsHasNoSeat() {
        when(sessionRepository.findByUserId("user-id")).thenReturn(null);

        assertThat(sessionService.getActiveSession("user-id")).isNull();
        assertThat(sessionService.userHasActiveSession("user-id")).isFalse();
    }

    @Test
    void deactivatingTheOthersReportsOnlyTheOnesThatHeldTheSeat() {
        UserSession kept = session("kept", true, Instant.now());
        UserSession playing = session("playing", true, Instant.now().minusSeconds(30));
        UserSession watching = session("watching", false, Instant.now().minusSeconds(30));
        givenSessions(kept, playing, watching);

        List<UserSession> superseded = sessionService.deactivateOtherSessions("user-id", "kept");

        // Only the connection that actually lost something is worth telling.
        assertThat(superseded).extracting(UserSession::getId).containsExactly("playing");
        assertThat(playing.isActive()).isFalse();
        assertThat(kept.isActive()).isTrue();
        verify(sessionRepository).save(playing);
        verify(sessionRepository, never()).save(kept);
        verify(sessionRepository, never()).save(watching);
    }

    @Test
    void unlockingReleasesEverySessionTheUserHas() {
        UserSession first = session("first", true, Instant.now().minusSeconds(30));
        UserSession second = session("second", true, Instant.now());
        givenSessions(first, second);

        sessionService.unlockUserSessions("user-id");

        assertThat(first.isActive()).isFalse();
        assertThat(second.isActive()).isFalse();
    }

    private void givenSessions(UserSession... sessions) {
        when(sessionRepository.findByUserId("user-id")).thenReturn(new ArrayList<>(List.of(sessions)));
    }

    private UserSession session(String id, boolean active, Instant createdAt) {
        UserSession session = new UserSession();
        session.setId(id);
        session.setUserId("user-id");
        session.setActive(active);
        session.setCreatedAt(createdAt);
        return session;
    }
}
