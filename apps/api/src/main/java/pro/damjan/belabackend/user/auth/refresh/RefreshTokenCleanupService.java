package pro.damjan.belabackend.user.auth.refresh;

import jakarta.transaction.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.redis.lock.DistributedLock;

import java.time.Duration;
import java.time.Instant;

@Service
public class RefreshTokenCleanupService {

    /**
     * Rows are kept for a week past expiry on purpose. Deleting them the moment they lapse
     * would turn a late replay from REUSE_DETECTED into a bland INVALID and lose the signal.
     */
    private static final Duration RETENTION_AFTER_EXPIRY = Duration.ofDays(7);

    private static final String LOCK_KEY = "cleanup:refresh-tokens";

    /**
     * Comfortably longer than the delete takes and far shorter than the hour between runs, so one
     * instance claims the tick and the next hour starts from a clean slate either way.
     */
    private static final Duration LOCK_LEASE = Duration.ofMinutes(5);

    private final RefreshTokenRepository refreshTokenRepository;
    private final DistributedLock distributedLock;

    public RefreshTokenCleanupService(RefreshTokenRepository refreshTokenRepository,
                                      DistributedLock distributedLock) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.distributedLock = distributedLock;
    }

    /**
     * The lock sits inside the transaction rather than around it: every instance schedules this,
     * and self-invoking a {@code @Transactional} method from a lambda would step past the proxy
     * and quietly run the delete without one. An instance that does not get the lock commits an
     * empty transaction, which costs nothing.
     */
    @Scheduled(fixedRate = 60 * 60 * 1000) // Run once per hour
    @Transactional
    public void cleanupExpiredRefreshTokens() {
        distributedLock.tryWithLock(LOCK_KEY, LOCK_LEASE, () ->
                refreshTokenRepository.deleteByExpiresAtBefore(Instant.now().minus(RETENTION_AFTER_EXPIRY)));
    }
}
