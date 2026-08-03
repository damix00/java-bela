package pro.damjan.belabackend.user.auth.refresh;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import pro.damjan.belabackend.security.jwt.JwtConfig;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserRepository;
import pro.damjan.belabackend.user.auth.AuthProvider;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RefreshTokenServiceTest {

    private static final long REFRESH_MS = Duration.ofDays(30).toMillis();
    private static final long ANON_REFRESH_MS = Duration.ofHours(24).toMillis();
    private static final long GRACE_MS = 30_000;

    private RefreshTokenRepository refreshTokenRepository;
    private RefreshTokenRevoker refreshTokenRevoker;
    private UserRepository userRepository;
    private RefreshTokenService refreshTokenService;

    @BeforeEach
    void setUp() {
        refreshTokenRepository = mock(RefreshTokenRepository.class);
        refreshTokenRevoker = mock(RefreshTokenRevoker.class);
        userRepository = mock(UserRepository.class);

        JwtConfig jwtConfig = new JwtConfig();
        jwtConfig.setRefreshExpirationMs(REFRESH_MS);
        jwtConfig.setRefreshAnonymousExpirationMs(ANON_REFRESH_MS);
        jwtConfig.setRefreshGraceMs(GRACE_MS);

        refreshTokenService = new RefreshTokenService(
                refreshTokenRepository, refreshTokenRevoker, userRepository, jwtConfig);

        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> {
            RefreshToken saved = invocation.getArgument(0);
            if (saved.getId() == null) {
                saved.setId(UUID.randomUUID().toString());
            }
            return saved;
        });
    }

    private static User user(AuthProvider provider) {
        User user = new User();
        user.setId("user-1");
        user.setAuthProvider(provider);
        return user;
    }

    private RefreshToken existing(String rawToken, Instant expiresAt) {
        RefreshToken token = new RefreshToken();
        token.setId("token-1");
        token.setTokenHash(TokenHasher.sha256Hex(rawToken));
        token.setFamilyId("family-1");
        token.setUserId("user-1");
        token.setCreatedAt(Instant.now().minus(Duration.ofMinutes(5)));
        token.setExpiresAt(expiresAt);

        when(refreshTokenRepository.findByTokenHash(token.getTokenHash())).thenReturn(Optional.of(token));
        when(refreshTokenRepository.findById("token-1")).thenReturn(Optional.of(token));
        return token;
    }

    @Test
    void storesAHashRatherThanTheRawToken() {
        IssuedRefreshToken issued = refreshTokenService.issue(user(AuthProvider.LOCAL), null, "agent", "1.2.3.4");

        assertThat(issued.entity().getTokenHash())
                .isNotEqualTo(issued.raw())
                .hasSize(64)
                .isEqualTo(TokenHasher.sha256Hex(issued.raw()));
    }

    @Test
    void givesGuestsAShorterLifetimeThanRegisteredUsers() {
        IssuedRefreshToken guest = refreshTokenService.issue(user(AuthProvider.ANONYMOUS), null, null, null);
        IssuedRefreshToken registered = refreshTokenService.issue(user(AuthProvider.LOCAL), null, null, null);

        assertThat(guest.expiresInSeconds()).isEqualTo(Duration.ofHours(24).toSeconds());
        assertThat(registered.expiresInSeconds()).isEqualTo(Duration.ofDays(30).toSeconds());
    }

    @Test
    void rotationMintsASuccessorInTheSameFamily() {
        String raw = "raw-token";
        existing(raw, Instant.now().plus(Duration.ofDays(1)));
        when(refreshTokenRepository.markUsed(eq("token-1"), any(Instant.class))).thenReturn(1);
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user(AuthProvider.LOCAL)));

        RotationResult result = refreshTokenService.rotate(raw, "agent", "1.2.3.4");

        assertThat(result.newRefreshToken()).isNotNull().isNotEqualTo(raw);

        ArgumentCaptor<RefreshToken> saved = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository, org.mockito.Mockito.atLeastOnce()).save(saved.capture());
        assertThat(saved.getAllValues()).allSatisfy(t -> assertThat(t.getFamilyId()).isEqualTo("family-1"));
    }

    @Test
    void losingTheRotationRaceInsideTheGraceWindowKeepsTheExistingToken() {
        String raw = "raw-token";
        RefreshToken token = existing(raw, Instant.now().plus(Duration.ofDays(1)));
        token.setUsedAt(Instant.now().minusMillis(1_000));
        when(refreshTokenRepository.markUsed(eq("token-1"), any(Instant.class))).thenReturn(0);
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user(AuthProvider.LOCAL)));

        RotationResult result = refreshTokenService.rotate(raw, null, null);

        assertThat(result.newRefreshToken()).isNull();
        assertThat(result.user().getId()).isEqualTo("user-1");
        verify(refreshTokenRevoker, never()).revokeFamilyNow(anyString());
    }

    @Test
    void replayingAConsumedTokenAfterTheGraceWindowRevokesTheFamily() {
        String raw = "raw-token";
        RefreshToken token = existing(raw, Instant.now().plus(Duration.ofDays(1)));
        token.setUsedAt(Instant.now().minusMillis(GRACE_MS + 5_000));
        when(refreshTokenRepository.markUsed(eq("token-1"), any(Instant.class))).thenReturn(0);

        assertThatThrownBy(() -> refreshTokenService.rotate(raw, null, null))
                .isInstanceOf(RefreshTokenException.class)
                .extracting(e -> ((RefreshTokenException) e).getError())
                .isEqualTo(RefreshError.REUSE_DETECTED);

        verify(refreshTokenRevoker).revokeFamilyNow("family-1");
    }

    @Test
    void replayingARevokedTokenRevokesTheFamily() {
        String raw = "raw-token";
        RefreshToken token = existing(raw, Instant.now().plus(Duration.ofDays(1)));
        token.setRevokedAt(Instant.now().minusMillis(1_000));

        assertThatThrownBy(() -> refreshTokenService.rotate(raw, null, null))
                .isInstanceOf(RefreshTokenException.class)
                .extracting(e -> ((RefreshTokenException) e).getError())
                .isEqualTo(RefreshError.REUSE_DETECTED);

        verify(refreshTokenRevoker).revokeFamilyNow("family-1");
    }

    @Test
    void anExpiredTokenDoesNotRevokeTheFamily() {
        String raw = "raw-token";
        existing(raw, Instant.now().minus(Duration.ofMinutes(1)));

        assertThatThrownBy(() -> refreshTokenService.rotate(raw, null, null))
                .isInstanceOf(RefreshTokenException.class)
                .extracting(e -> ((RefreshTokenException) e).getError())
                .isEqualTo(RefreshError.EXPIRED);

        verify(refreshTokenRevoker, never()).revokeFamilyNow(anyString());
    }

    @Test
    void reportsUserGoneWhenTheAccountHasBeenSweptAway() {
        String raw = "raw-token";
        existing(raw, Instant.now().plus(Duration.ofDays(1)));
        when(refreshTokenRepository.markUsed(eq("token-1"), any(Instant.class))).thenReturn(1);
        when(userRepository.findById("user-1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> refreshTokenService.rotate(raw, null, null))
                .isInstanceOf(RefreshTokenException.class)
                .extracting(e -> ((RefreshTokenException) e).getError())
                .isEqualTo(RefreshError.USER_GONE);
    }

    @Test
    void reportsInvalidForAnUnknownToken() {
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> refreshTokenService.rotate("nope", null, null))
                .isInstanceOf(RefreshTokenException.class)
                .extracting(e -> ((RefreshTokenException) e).getError())
                .isEqualTo(RefreshError.INVALID);
    }

    @Test
    void logoutRevokesTheWholeFamilyAndIgnoresUnknownTokens() {
        String raw = "raw-token";
        existing(raw, Instant.now().plus(Duration.ofDays(1)));

        refreshTokenService.revokeFamilyOf(raw);
        verify(refreshTokenRepository).revokeFamily(eq("family-1"), any(Instant.class));

        when(refreshTokenRepository.findByTokenHash(TokenHasher.sha256Hex("unknown"))).thenReturn(Optional.empty());
        refreshTokenService.revokeFamilyOf("unknown");
        refreshTokenService.revokeFamilyOf(null);
    }

    @Test
    void issuingBeyondTheSessionCapRevokesTheOldestFamily() {
        when(refreshTokenRepository.countByUserIdAndRevokedAtIsNullAndExpiresAtAfter(eq("user-1"), any(Instant.class)))
                .thenReturn(10L);

        RefreshToken oldest = new RefreshToken();
        oldest.setFamilyId("oldest-family");
        when(refreshTokenRepository
                .findAllByUserIdAndRevokedAtIsNullAndExpiresAtAfterOrderByCreatedAtAsc(eq("user-1"), any(Instant.class)))
                .thenReturn(java.util.List.of(oldest));

        refreshTokenService.issue(user(AuthProvider.LOCAL), null, null, null);

        verify(refreshTokenRepository).revokeFamily(eq("oldest-family"), any(Instant.class));
    }
}
