package pro.damjan.belabackend.user;

import jakarta.transaction.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.redis.lock.DistributedLock;
import pro.damjan.belabackend.user.auth.AuthProvider;
import pro.damjan.belabackend.user.auth.refresh.RefreshTokenRepository;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class UserCleanupService {

    private static final String LOCK_KEY = "cleanup:anonymous-users";

    /**
     * Comfortably longer than the sweep takes and far shorter than the hour between runs, so one
     * instance claims the tick and the next hour starts fresh either way.
     */
    private static final Duration LOCK_LEASE = Duration.ofMinutes(5);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final DistributedLock distributedLock;

    public UserCleanupService(UserRepository userRepository,
                              RefreshTokenRepository refreshTokenRepository,
                              DistributedLock distributedLock) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.distributedLock = distributedLock;
    }

    /**
     * The lock sits inside the transaction rather than around it: every instance schedules this,
     * and self-invoking a {@code @Transactional} method from a lambda would step past the proxy
     * and run the deletes with no transaction at all. An instance that does not get the lock
     * commits an empty transaction, which costs nothing.
     */
    @Scheduled(fixedRate = 60 * 60 * 1000) // Run once per hour
    @Transactional
    public void cleanupAnonymousUsers() {
        distributedLock.tryWithLock(LOCK_KEY, LOCK_LEASE, this::deleteStaleGuests);
    }

    private void deleteStaleGuests() {
        // Clean up anonymous users that are older than 24 hours
        Instant cutoffTime = Instant.now().minus(Duration.ofHours(24));

        // Their refresh tokens go first, otherwise orphan rows accumulate forever
        List<String> doomedUserIds =
                userRepository.findIdsByAuthProviderAndCreatedAtBefore(AuthProvider.ANONYMOUS, cutoffTime);
        if (!doomedUserIds.isEmpty()) {
            refreshTokenRepository.deleteByUserIdIn(doomedUserIds);
        }

        userRepository.deleteUsersByAuthProviderAndCreatedAtBefore(AuthProvider.ANONYMOUS, cutoffTime);
    }
}
