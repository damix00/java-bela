package pro.damjan.belabackend.admin;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import pro.damjan.belabackend.admin.account.AdminAccountService;
import pro.damjan.belabackend.admin.account.AdminAccountSignedOutEvent;
import pro.damjan.belabackend.admin.account.AdminAuditLog;
import pro.damjan.belabackend.admin.account.AdminAuditLogRepository;
import pro.damjan.belabackend.admin.dto.response.AdminAccountDetailResponse;
import pro.damjan.belabackend.admin.dto.response.AdminAccountPageResponse;
import pro.damjan.belabackend.exception.ExceptionResponse;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserRepository;
import pro.damjan.belabackend.user.auth.AuthProvider;
import pro.damjan.belabackend.user.auth.Role;
import pro.damjan.belabackend.user.auth.refresh.RefreshTokenRepository;
import pro.damjan.belabackend.user.auth.refresh.RefreshTokenService;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;
import pro.damjan.belabackend.user.presence.session.SessionMetadata;
import pro.damjan.belabackend.user.presence.session.SessionRepository;
import pro.damjan.belabackend.user.presence.session.SessionService;
import pro.damjan.belabackend.user.presence.session.UserSession;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminAccountServiceTest {
    private static final Instant NOW = Instant.parse("2026-09-17T12:00:00Z");

    private UserRepository userRepository;
    private SessionRepository sessionRepository;
    private SessionService sessionService;
    private UserPresenceService presenceService;
    private RefreshTokenService refreshTokenService;
    private RefreshTokenRepository refreshTokenRepository;
    private AdminAuditLogRepository auditLogRepository;
    private ApplicationEventPublisher eventPublisher;
    private AdminAccountService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        sessionRepository = mock(SessionRepository.class);
        sessionService = mock(SessionService.class);
        presenceService = mock(UserPresenceService.class);
        refreshTokenService = mock(RefreshTokenService.class);
        refreshTokenRepository = mock(RefreshTokenRepository.class);
        auditLogRepository = mock(AdminAuditLogRepository.class);
        eventPublisher = mock(ApplicationEventPublisher.class);
        service = new AdminAccountService(
                userRepository,
                sessionRepository,
                sessionService,
                presenceService,
                refreshTokenService,
                refreshTokenRepository,
                auditLogRepository,
                eventPublisher,
                Clock.fixed(NOW, ZoneOffset.UTC)
        );
    }

    @Test
    @SuppressWarnings("unchecked")
    void returnsOnlyTwentyFiveAccountsAndAStableNextCursor() {
        List<User> users = new ArrayList<>();
        for (int index = 0; index < 26; index++) {
            users.add(user("user-" + index, "User" + index, AuthProvider.LOCAL, Role.USER,
                    NOW.minusSeconds(index)));
        }
        UserSession session = session("session-1", "user-0", "127.0.0.1", "Browser");
        when(sessionRepository.findAll()).thenReturn(List.of(session));
        when(userRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(users));

        AdminAccountPageResponse result = service.list(null, "ALL", "ALL", "ALL", null);

        assertThat(result.accounts()).hasSize(25);
        assertThat(result.nextCursor()).isNotBlank();
        assertThat(result.accounts().getFirst().active()).isTrue();
        assertThat(result.accounts().getFirst().sessionCount()).isEqualTo(1);
        assertThat(result.accounts()).noneMatch(account -> account.id().equals("user-25"));
    }

    @Test
    void accountDetailsIncludeSensitiveSessionMetadataOnlyOnTheDetailPayload() {
        User actor = user("admin-1", "Admin", AuthProvider.LOCAL, Role.ADMIN, NOW.minusSeconds(10));
        User target = user("user-1", "Player", AuthProvider.LOCAL, Role.USER, NOW.minusSeconds(5));
        UserSession session = session("session-1", target.getId(), "203.0.113.4", "Test Browser");
        when(userRepository.findById(target.getId())).thenReturn(Optional.of(target));
        when(userRepository.countByRole(Role.ADMIN)).thenReturn(2L);
        when(sessionService.getUserSessions(target.getId())).thenReturn(List.of(session));

        AdminAccountDetailResponse result = service.detail(actor, target.getId());

        assertThat(result.sessions()).singleElement().satisfies(item -> {
            assertThat(item.ipAddress()).isEqualTo("203.0.113.4");
            assertThat(item.userAgent()).isEqualTo("Test Browser");
        });
        assertThat(result.actions().canDelete()).isTrue();
        assertThat(result.actions().canChangeRole()).isTrue();
    }

    @Test
    void forceSignOutRevokesEveryCredentialAndWritesAnAuditEntry() {
        User actor = user("admin-1", "Admin", AuthProvider.LOCAL, Role.ADMIN, NOW.minusSeconds(10));
        User target = user("user-1", "Player", AuthProvider.LOCAL, Role.USER, NOW.minusSeconds(5));
        when(userRepository.findByIdForUpdate(target.getId())).thenReturn(Optional.of(target));

        service.forceSignOut(actor, target.getId());

        assertThat(target.getCredentialsValidAfter()).isEqualTo(NOW);
        verify(refreshTokenService).revokeAllForUser(target.getId());
        verify(eventPublisher).publishEvent(new AdminAccountSignedOutEvent(target.getId(), false));
        verify(auditLogRepository).save(any(AdminAuditLog.class));
    }

    @Test
    void refusesSelfDeletionAndDoesNotCreateSideEffects() {
        User actor = user("admin-1", "Admin", AuthProvider.LOCAL, Role.ADMIN, NOW);
        when(userRepository.findAllByRoleForUpdate(Role.ADMIN)).thenReturn(List.of(actor));
        when(userRepository.findByIdForUpdate(actor.getId())).thenReturn(Optional.of(actor));

        assertThatThrownBy(() -> service.delete(actor, actor.getId(), actor.getUsername()))
                .isInstanceOf(ExceptionResponse.class)
                .hasMessage("Administrators cannot delete themselves");

        verify(userRepository, never()).delete(any(User.class));
        verify(auditLogRepository, never()).save(any());
    }

    @Test
    void refusesToDeleteAnAccountAttachedToAGame() {
        User actor = user("admin-1", "Admin", AuthProvider.LOCAL, Role.ADMIN, NOW);
        User target = user("user-1", "Player", AuthProvider.LOCAL, Role.USER, NOW);
        when(userRepository.findAllByRoleForUpdate(Role.ADMIN)).thenReturn(List.of(actor));
        when(userRepository.findByIdForUpdate(target.getId())).thenReturn(Optional.of(target));
        when(presenceService.getUserPresence(target.getId()))
                .thenReturn(new UserPresence(NOW, null, "game-1"));

        assertThatThrownBy(() -> service.delete(actor, target.getId(), target.getUsername()))
                .isInstanceOf(ExceptionResponse.class)
                .hasMessage("Accounts in a lobby or game cannot be deleted");
    }

    @Test
    void deletesCredentialsAndAccountWhileKeepingAnAuditSnapshot() {
        User actor = user("admin-1", "Admin", AuthProvider.LOCAL, Role.ADMIN, NOW);
        User target = user("guest-1", "Guest", AuthProvider.ANONYMOUS, Role.USER, NOW);
        when(userRepository.findAllByRoleForUpdate(Role.ADMIN)).thenReturn(List.of(actor));
        when(userRepository.findByIdForUpdate(target.getId())).thenReturn(Optional.of(target));

        service.delete(actor, target.getId(), target.getUsername());

        verify(refreshTokenRepository).deleteByUserIdIn(List.of(target.getId()));
        verify(userRepository).delete(target);
        verify(eventPublisher).publishEvent(new AdminAccountSignedOutEvent(target.getId(), true));
        verify(auditLogRepository).save(any(AdminAuditLog.class));
    }

    @Test
    void refusesRoleChangesForGuestsAndTheFinalAdministrator() {
        User actor = user("admin-1", "Admin", AuthProvider.LOCAL, Role.ADMIN, NOW);
        User guest = user("guest-1", "Guest", AuthProvider.ANONYMOUS, Role.USER, NOW);
        when(userRepository.findAllByRoleForUpdate(Role.ADMIN)).thenReturn(List.of(actor));
        when(userRepository.findByIdForUpdate(guest.getId())).thenReturn(Optional.of(guest));

        assertThatThrownBy(() -> service.changeRole(actor, guest.getId(), "ADMIN", guest.getUsername()))
                .isInstanceOf(ExceptionResponse.class)
                .hasMessage("Guest accounts cannot be administrators");

        User otherActor = user("admin-2", "OtherAdmin", AuthProvider.LOCAL, Role.ADMIN, NOW);
        when(userRepository.findByIdForUpdate(actor.getId())).thenReturn(Optional.of(actor));
        assertThatThrownBy(() -> service.changeRole(otherActor, actor.getId(), "USER", actor.getUsername()))
                .isInstanceOf(ExceptionResponse.class)
                .hasMessage("The final administrator cannot be demoted");
    }

    private static User user(String id,
                             String username,
                             AuthProvider provider,
                             Role role,
                             Instant createdAt) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setAuthProvider(provider);
        user.setRole(role);
        user.setCreatedAt(createdAt);
        user.setUpdatedAt(createdAt);
        return user;
    }

    private static UserSession session(String id,
                                       String userId,
                                       String ipAddress,
                                       String userAgent) {
        UserSession session = new UserSession();
        session.setId(id);
        session.setUserId(userId);
        session.setActive(true);
        session.setCreatedAt(NOW);
        session.setMetadata(SessionMetadata.builder()
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build());
        return session;
    }
}
