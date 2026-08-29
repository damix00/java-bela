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
        if (key == null || key.isBlank()) {
            throw new IllegalArgumentException("Lock key must not be blank");
        }

        Map<String, Holding> holdings = held.get();
        Holding existing = holdings.get(key);

        // Already ours further up the stack: go straight in, and leave releasing to the outermost
        // frame. Re-taking it remotely would block on ourselves.
        if (existing != null) {
            holdings.put(key, new Holding(existing.token(), existing.depth() + 1));
            try {
                return action.get();
            } finally {
                unwind(holdings, key, existing);
            }
        }

        String token = UUID.randomUUID().toString();
        acquire(key, token, lease, wait);
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

    private void unwind(Map<String, Holding> holdings, String key, Holding previous) {
        holdings.put(key, previous);
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
