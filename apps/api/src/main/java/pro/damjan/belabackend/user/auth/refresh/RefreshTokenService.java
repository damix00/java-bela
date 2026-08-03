package pro.damjan.belabackend.user.auth.refresh;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pro.damjan.belabackend.security.jwt.JwtConfig;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserRepository;
import pro.damjan.belabackend.user.auth.AuthProvider;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class RefreshTokenService {

    /** Beyond this many live tokens for one user, the oldest family is revoked. */
    private static final int MAX_LIVE_TOKENS_PER_USER = 10;

    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenRevoker refreshTokenRevoker;
    private final UserRepository userRepository;
    private final JwtConfig jwtConfig;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                               RefreshTokenRevoker refreshTokenRevoker,
                               UserRepository userRepository,
                               JwtConfig jwtConfig) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenRevoker = refreshTokenRevoker;
        this.userRepository = userRepository;
        this.jwtConfig = jwtConfig;
    }

    @Transactional
    public IssuedRefreshToken issue(User user, String familyId, String userAgent, String ipAddress) {
        Instant now = Instant.now();

        if (familyId == null) {
            enforceSessionCap(user.getId(), now);
        }

        String raw = TokenHasher.generateToken();

        RefreshToken token = new RefreshToken();
        token.setTokenHash(TokenHasher.sha256Hex(raw));
        token.setFamilyId(familyId != null ? familyId : UUID.randomUUID().toString());
        token.setUserId(user.getId());
        token.setCreatedAt(now);
        token.setExpiresAt(now.plusMillis(lifetimeMsFor(user)));
        token.setUserAgent(truncate(userAgent, 512));
        token.setIpAddress(truncate(ipAddress, 45));

        return new IssuedRefreshToken(raw, refreshTokenRepository.save(token));
    }

    /**
     * Exchanges a refresh token for a successor, sliding the expiry forward.
     *
     * @throws RefreshTokenException on anything the caller should be logged out for
     */
    @Transactional
    public RotationResult rotate(String rawToken, String userAgent, String ipAddress) {
        Instant now = Instant.now();

        RefreshToken current = refreshTokenRepository.findByTokenHash(TokenHasher.sha256Hex(rawToken))
                .orElseThrow(() -> new RefreshTokenException(RefreshError.INVALID, "Unknown refresh token"));

        if (current.getRevokedAt() != null) {
            // Someone is replaying a token we already killed. Kill the rest of the lineage too.
            // Committed separately, because the throw below rolls this transaction back.
            refreshTokenRevoker.revokeFamilyNow(current.getFamilyId());
            throw new RefreshTokenException(RefreshError.REUSE_DETECTED, "Refresh token has been revoked");
        }

        if (current.isExpiredAt(now)) {
            // Merely aged out — not an attack, so the family stays alive.
            throw new RefreshTokenException(RefreshError.EXPIRED, "Refresh token has expired");
        }

        if (refreshTokenRepository.markUsed(current.getId(), now) == 0) {
            return handleAlreadyUsed(current, now);
        }

        User user = userRepository.findById(current.getUserId())
                .orElseThrow(() -> new RefreshTokenException(RefreshError.USER_GONE, "User no longer exists"));

        IssuedRefreshToken successor = issue(user, current.getFamilyId(), userAgent, ipAddress);

        current.setUsedAt(now);
        current.setRotatedToId(successor.entity().getId());
        refreshTokenRepository.save(current);

        return new RotationResult(user, successor.raw(), successor.expiresInSeconds());
    }

    /** Logout: kills the whole lineage this token belongs to. Unknown tokens are a no-op. */
    @Transactional
    public void revokeFamilyOf(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }

        refreshTokenRepository.findByTokenHash(TokenHasher.sha256Hex(rawToken))
                .ifPresent(token -> refreshTokenRepository.revokeFamily(token.getFamilyId(), Instant.now()));
    }

    /** Log out everywhere. */
    @Transactional
    public void revokeAllForUser(String userId) {
        refreshTokenRepository.revokeAllForUser(userId, Instant.now());
    }

    /**
     * Someone else consumed this row between our read and our update. Inside the grace window
     * that is just a second browser tab, so hand back a fresh access token and leave the cookie
     * jar alone (newRefreshToken == null). Outside it, it is a genuine replay.
     */
    private RotationResult handleAlreadyUsed(RefreshToken current, Instant now) {
        RefreshToken reread = refreshTokenRepository.findById(current.getId()).orElse(current);

        boolean withinGrace = reread.getRevokedAt() == null
                && reread.getUsedAt() != null
                && Duration.between(reread.getUsedAt(), now).toMillis() <= jwtConfig.getRefreshGraceMs();

        if (!withinGrace) {
            refreshTokenRevoker.revokeFamilyNow(reread.getFamilyId());
            throw new RefreshTokenException(RefreshError.REUSE_DETECTED, "Refresh token has already been used");
        }

        User user = userRepository.findById(reread.getUserId())
                .orElseThrow(() -> new RefreshTokenException(RefreshError.USER_GONE, "User no longer exists"));

        return new RotationResult(user, null, 0);
    }

    private void enforceSessionCap(String userId, Instant now) {
        if (refreshTokenRepository.countByUserIdAndRevokedAtIsNullAndExpiresAtAfter(userId, now)
                < MAX_LIVE_TOKENS_PER_USER) {
            return;
        }

        List<RefreshToken> live = refreshTokenRepository
                .findAllByUserIdAndRevokedAtIsNullAndExpiresAtAfterOrderByCreatedAtAsc(userId, now);

        Optional.ofNullable(live.isEmpty() ? null : live.getFirst())
                .ifPresent(oldest -> refreshTokenRepository.revokeFamily(oldest.getFamilyId(), now));
    }

    private long lifetimeMsFor(User user) {
        return user.getAuthProvider() == AuthProvider.ANONYMOUS
                ? jwtConfig.getRefreshAnonymousExpirationMs()
                : jwtConfig.getRefreshExpirationMs();
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
