package pro.damjan.belabackend.redis.lock;

import java.time.Duration;
import java.util.function.Supplier;

/**
 * Mutual exclusion that holds across instances.
 *
 * The JVM's own locks stop at the process boundary, which is no use once a second replica is
 * running: two instances would each take their own lock and both walk into the same critical
 * section. Implementations here coordinate through shared state instead.
 */
public interface DistributedLock {

    /**
     * Runs an action while holding the lock, releasing it afterwards however the action ends.
     *
     * @param key    what is being locked; callers namespace this themselves
     * @param lease  how long the lock survives without being released, so a process that dies
     *               mid-section cannot wedge the key forever. Must comfortably exceed the
     *               slowest run of the action.
     * @param wait   how long to keep trying before giving up
     * @throws LockAcquisitionException if the lock could not be taken within {@code wait}
     */
    <T> T withLock(String key, Duration lease, Duration wait, Supplier<T> action);

    default void withLock(String key, Duration lease, Duration wait, Runnable action) {
        withLock(key, lease, wait, () -> {
            action.run();
            return null;
        });
    }
}
