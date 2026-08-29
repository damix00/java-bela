package pro.damjan.belabackend.redis.lock;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;

/**
 * A {@link DistributedLock} that a thread may re-enter.
 *
 * Reentrancy is not decoration. The JVM lock this replaced was a {@code ReentrantLock}, so code
 * written against it is entitled to nest, and a plain remote lock turns that nesting into a
 * deadlock against itself — the inner call waits for a lock the outer call is holding and cannot
 * release, so the thread stalls until the lease expires rather than failing outright. Tracking
 * depth per thread keeps the old contract and removes the trap.
 *
 * Depth is held per thread, so the lock excludes across instances and across threads, but never
 * against the one call stack that already owns it.
 */
@Service
@RequiredArgsConstructor
public class ReentrantDistributedLock implements DistributedLock {

    /** How long to pause between attempts. Short enough to feel immediate, long enough not to spin. */
    private static final Duration RETRY_INTERVAL = Duration.ofMillis(25);

    private final LockStore lockStore;

    /**
     * Keys this thread holds, with the token that took each and how deep the nesting goes.
     *
     * A plain {@link HashMap} is safe despite being unsynchronised: the map belongs to one thread
     * and never escapes it.
     */
    private final ThreadLocal<Map<String, Holding>> held = ThreadLocal.withInitial(HashMap::new);

    private record Holding(String token, int depth) {}

    @Override
    public <T> T withLock(String key, Duration lease, Duration wait, Supplier<T> action) {
        requireKey(key);

        Map<String, Holding> holdings = held.get();
        Holding existing = holdings.get(key);

        if (existing != null) return reenter(holdings, key, existing, action);

        String token = UUID.randomUUID().toString();
        acquire(key, token, lease, wait);

        return holdWhile(holdings, key, token, action);
    }

    @Override
    public boolean tryWithLock(String key, Duration lease, Runnable action) {
        requireKey(key);

        Map<String, Holding> holdings = held.get();
        Holding existing = holdings.get(key);

        // Reentering is not contention: this thread already holds the key, so the work is not a
        // duplicate of somebody else's and there is nothing to decline.
        if (existing != null) {
            reenter(holdings, key, existing, asSupplier(action));
            return true;
        }

        String token = UUID.randomUUID().toString();
        if (!lockStore.tryAcquire(key, token, lease)) return false;

        holdWhile(holdings, key, token, asSupplier(action));
        return true;
    }

    /**
     * Runs inside a lock this thread already holds further up the stack.
     *
     * Releasing is left to the outermost frame, which is the whole point — re-taking the key
     * remotely would block on ourselves.
     */
    private <T> T reenter(Map<String, Holding> holdings, String key, Holding existing, Supplier<T> action) {
        holdings.put(key, new Holding(existing.token(), existing.depth() + 1));
        try {
            return action.get();
        } finally {
            holdings.put(key, existing);
        }
    }

    /** Runs while holding a key this thread has just taken, releasing it however the action ends. */
    private <T> T holdWhile(Map<String, Holding> holdings, String key, String token, Supplier<T> action) {
        holdings.put(key, new Holding(token, 1));

        try {
            return action.get();
        } finally {
            holdings.remove(key);
            // The ThreadLocal would otherwise pin an empty map to a pooled request thread forever.
            if (holdings.isEmpty()) held.remove();
            lockStore.release(key, token);
        }
    }

    private static Supplier<Void> asSupplier(Runnable action) {
        return () -> {
            action.run();
            return null;
        };
    }

    private static void requireKey(String key) {
        if (key == null || key.isBlank()) {
            throw new IllegalArgumentException("Lock key must not be blank");
        }
    }

    private void acquire(String key, String token, Duration lease, Duration wait) {
        long deadline = System.nanoTime() + wait.toNanos();

        while (true) {
            if (lockStore.tryAcquire(key, token, lease)) return;

            if (System.nanoTime() >= deadline) {
                throw new LockAcquisitionException(key);
            }

            try {
                Thread.sleep(RETRY_INTERVAL.toMillis());
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                throw new LockAcquisitionException(key);
            }
        }
    }
}
