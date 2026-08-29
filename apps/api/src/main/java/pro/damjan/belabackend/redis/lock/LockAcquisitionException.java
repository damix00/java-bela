package pro.damjan.belabackend.redis.lock;

/** Thrown when a lock could not be taken within the caller's wait budget. */
public class LockAcquisitionException extends RuntimeException {

    public LockAcquisitionException(String key) {
        super("Timed out waiting for lock: " + key);
    }
}
