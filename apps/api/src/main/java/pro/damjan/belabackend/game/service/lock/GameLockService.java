package pro.damjan.belabackend.game.service.lock;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.redis.lock.DistributedLock;

import java.time.Duration;
import java.util.function.Supplier;

/**
 * Serialises work on a single game.
 *
 * This used to be a map of {@link java.util.concurrent.locks.ReentrantLock}, which excluded only
 * within one JVM. Games live in Redis and any instance can be asked to act on any of them — a
 * scheduled task fires wherever the poller runs, not where the players are connected — so a second
 * replica meant two threads mutating the same game while each believed it held the lock. The
 * locking now goes through Redis, which every instance shares.
 *
 * The lease has to outlast the slowest section, and sections here span Redis reads, game mutation
 * and WebSocket publishes. Ten seconds is far more than any of them take; a section that somehow
 * outran it would let a second holder in, so keep them short rather than raising the lease.
 */
@Service
@RequiredArgsConstructor
public class GameLockService {

    private static final Duration LEASE = Duration.ofSeconds(10);
    private static final Duration WAIT = Duration.ofSeconds(10);
    private static final String KEY_PREFIX = "game:lock:";

    private final DistributedLock distributedLock;

    public void withGameLock(String gameId, Runnable action) {
        withGameLock(gameId, () -> {
            action.run();
            return null;
        });
    }

    public <T> T withGameLock(String gameId, Supplier<T> action) {
        if (gameId == null || gameId.isBlank()) {
            throw new IllegalArgumentException("Game id is required for locking");
        }

        return distributedLock.withLock(KEY_PREFIX + gameId, LEASE, WAIT, action);
    }
}
