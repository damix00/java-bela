package pro.damjan.belabackend.redis.lock;

import java.time.Duration;

/**
 * The single-attempt primitive a {@link DistributedLock} is built from.
 *
 * Separated from the retrying, reentrancy-tracking logic above it so that logic can be tested
 * without a Redis to talk to — the awkward parts of locking are the bookkeeping, not the two
 * commands underneath.
 */
public interface LockStore {

    /** One attempt, no waiting. True if this caller now holds {@code key}. */
    boolean tryAcquire(String key, String token, Duration lease);

    /**
     * Releases the lock, but only if {@code token} still holds it.
     *
     * The token check is what stops a holder whose lease expired mid-section from deleting the
     * lock a different instance has since taken.
     */
    void release(String key, String token);
}
