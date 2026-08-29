package pro.damjan.belabackend.redis.lock;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * A {@link LockStore} with Redis's semantics and none of its infrastructure.
 *
 * Both operations are single {@code compute} calls, which is what makes this a fair stand-in:
 * SET NX and the compare-and-delete script are atomic on the server, and a fake that checked and
 * then wrote would pass tests the real thing would fail.
 */
public class InMemoryLockStore implements LockStore {

    private record Entry(String token, long expiresAt) {}

    private final Map<String, Entry> locks = new ConcurrentHashMap<>();

    @Override
    public boolean tryAcquire(String key, String token, Duration lease) {
        long now = System.nanoTime();

        Entry holder = locks.compute(key, (ignored, existing) ->
                existing != null && existing.expiresAt() > now
                        ? existing
                        : new Entry(token, now + lease.toNanos()));

        return holder.token().equals(token);
    }

    @Override
    public void release(String key, String token) {
        locks.computeIfPresent(key, (ignored, existing) ->
                existing.token().equals(token) ? null : existing);
    }

    public boolean isHeld(String key) {
        Entry entry = locks.get(key);
        return entry != null && entry.expiresAt() > System.nanoTime();
    }
}
