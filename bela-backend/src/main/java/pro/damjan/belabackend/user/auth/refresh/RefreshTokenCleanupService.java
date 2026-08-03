package pro.damjan.belabackend.user.auth.refresh;

import jakarta.transaction.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
public class RefreshTokenCleanupService {

    /**
     * Rows are kept for a week past expiry on purpose. Deleting them the moment they lapse
     * would turn a late replay from REUSE_DETECTED into a bland INVALID and lose the signal.
     */
    private static final Duration RETENTION_AFTER_EXPIRY = Duration.ofDays(7);

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenCleanupService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Scheduled(fixedRate = 60 * 60 * 1000) // Run once per hour
    @Transactional
    public void cleanupExpiredRefreshTokens() {
        refreshTokenRepository.deleteByExpiresAtBefore(Instant.now().minus(RETENTION_AFTER_EXPIRY));
    }
}
