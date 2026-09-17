package pro.damjan.belabackend.admin;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.admin.dto.response.AdminAnalyticsResponse;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.game.repository.BeloteGameRepository;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyStatus;
import pro.damjan.belabackend.lobby.repository.LobbyRepository;
import pro.damjan.belabackend.user.UserRepository;
import pro.damjan.belabackend.user.auth.AuthProvider;
import pro.damjan.belabackend.user.auth.Role;
import pro.damjan.belabackend.user.presence.session.SessionRepository;
import pro.damjan.belabackend.user.presence.session.UserSession;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminAnalyticsServiceTest {

    private static final Instant NOW = Instant.parse("2026-09-02T12:00:00Z");

    private UserRepository userRepository;
    private SessionRepository sessionRepository;
    private LobbyRepository lobbyRepository;
    private BeloteGameRepository gameRepository;
    private AdminAnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        sessionRepository = mock(SessionRepository.class);
        lobbyRepository = mock(LobbyRepository.class);
        gameRepository = mock(BeloteGameRepository.class);
        Clock clock = Clock.fixed(NOW, ZoneOffset.UTC);
        analyticsService = new AdminAnalyticsService(
                userRepository, sessionRepository, lobbyRepository, gameRepository, clock);
    }

    @Test
    void buildsACompleteSnapshotFromPostgresAndRedis() {
        when(userRepository.count()).thenReturn(12L);
        when(userRepository.countByAuthProvider(AuthProvider.LOCAL)).thenReturn(8L);
        when(userRepository.countByAuthProvider(AuthProvider.ANONYMOUS)).thenReturn(4L);
        when(userRepository.countByRole(Role.ADMIN)).thenReturn(1L);
        stubRecentRegisteredCounts(3L, 5L, 7L);

        when(sessionRepository.findAll()).thenReturn(List.of(
                session("session-1", "user-a"),
                session("session-2", "user-a"),
                session("session-3", "user-b")
        ));
        when(lobbyRepository.findAll()).thenReturn(List.of(
                lobby("lobby-1", LobbyStatus.IN_LOBBY),
                lobby("lobby-2", LobbyStatus.IN_LOBBY),
                lobby("lobby-3", LobbyStatus.MATCHMAKING),
                lobby("lobby-4", LobbyStatus.IN_GAME)
        ));
        when(gameRepository.findAll()).thenReturn(List.of(
                game(GameStatus.WAITING),
                game(GameStatus.IN_PROGRESS),
                game(GameStatus.IN_PROGRESS),
                game(GameStatus.FINISHED)
        ));

        AdminAnalyticsResponse snapshot = analyticsService.snapshot();

        assertThat(snapshot.getGeneratedAt()).isEqualTo(NOW);
        assertThat(snapshot.getUsers())
                .extracting(
                        "total",
                        "registered",
                        "guests",
                        "admins",
                        "registeredLast24Hours",
                        "registeredLast7Days",
                        "registeredLast30Days"
                )
                .containsExactly(12L, 8L, 4L, 1L, 3L, 5L, 7L);
        assertThat(snapshot.getActivity())
                .extracting(
                        "connectedUsers",
                        "sessions",
                        "lobbiesTotal",
                        "lobbiesInLobby",
                        "lobbiesMatchmaking",
                        "lobbiesInGame",
                        "gamesTotal",
                        "gamesWaiting",
                        "gamesInProgress",
                        "gamesFinished"
                )
                .containsExactly(2L, 3L, 4L, 2L, 1L, 1L, 4L, 1L, 2L, 1L);

        verify(userRepository).countByAuthProviderAndCreatedAtGreaterThanEqual(
                AuthProvider.LOCAL, NOW.minus(Duration.ofHours(24)));
        verify(userRepository).countByAuthProviderAndCreatedAtGreaterThanEqual(
                AuthProvider.LOCAL, NOW.minus(Duration.ofDays(7)));
        verify(userRepository).countByAuthProviderAndCreatedAtGreaterThanEqual(
                AuthProvider.LOCAL, NOW.minus(Duration.ofDays(30)));
    }

    private void stubRecentRegisteredCounts(long last24Hours, long last7Days, long last30Days) {
        when(userRepository.countByAuthProviderAndCreatedAtGreaterThanEqual(
                AuthProvider.LOCAL, NOW.minus(Duration.ofHours(24)))).thenReturn(last24Hours);
        when(userRepository.countByAuthProviderAndCreatedAtGreaterThanEqual(
                AuthProvider.LOCAL, NOW.minus(Duration.ofDays(7)))).thenReturn(last7Days);
        when(userRepository.countByAuthProviderAndCreatedAtGreaterThanEqual(
                AuthProvider.LOCAL, NOW.minus(Duration.ofDays(30)))).thenReturn(last30Days);
    }

    private static UserSession session(String id, String userId) {
        UserSession session = new UserSession();
        session.setId(id);
        session.setUserId(userId);
        return session;
    }

    private static Lobby lobby(String id, LobbyStatus status) {
        Lobby lobby = new Lobby();
        lobby.setId(id);
        lobby.setStatus(status);
        return lobby;
    }

    private static BeloteGame game(GameStatus status) {
        return BeloteGame.builder().status(status).build();
    }
}
