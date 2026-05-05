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

        ReentrantLock lock = locks.computeIfAbsent(gameId, ignored -> new ReentrantLock());
        lock.lock();
        try {
            return action.get();
        } finally {
            lock.unlock();
            if (!lock.isLocked() && !lock.hasQueuedThreads()) {
                locks.remove(gameId, lock);
            }
        }
    }
}
