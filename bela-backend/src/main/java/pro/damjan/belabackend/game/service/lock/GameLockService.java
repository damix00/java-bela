package pro.damjan.belabackend.game.service.lock;

import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Supplier;

@Service
public class GameLockService {

    private final ConcurrentHashMap<String, ReentrantLock> locks = new ConcurrentHashMap<>();

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

        ReentrantLock lock = acquireCanonicalLock(gameId);
        try {
            return action.get();
        } finally {
            lock.unlock();
            // Only evict when no one is waiting on this lock. Combined with the re-check in
            // acquireCanonicalLock, this prevents two threads from running under different lock
            // instances for the same game.
            if (!lock.hasQueuedThreads()) {
                locks.remove(gameId, lock);
            }
        }
    }

    private ReentrantLock acquireCanonicalLock(String gameId) {
        while (true) {
            ReentrantLock lock = locks.computeIfAbsent(gameId, ignored -> new ReentrantLock());
            lock.lock();
            // The lock we acquired may have been evicted from the map by a finishing thread between
            // computeIfAbsent and lock(). If so, a different thread may now hold a fresh lock for the
            // same game, so this one no longer guarantees exclusivity: drop it and retry.
            if (locks.get(gameId) == lock) {
                return lock;
            }
            lock.unlock();
        }
    }
}
