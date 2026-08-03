package pro.damjan.belabackend.user.auth.refresh;

public enum RefreshError {
    /** No such token — never issued, or already cleaned up. */
    INVALID,
    /** Issued by us, but past its expiry. */
    EXPIRED,
    /** Presented after it was consumed or revoked; the whole family is now revoked. */
    REUSE_DETECTED,
    /** The token is fine but its user no longer exists (e.g. a swept guest account). */
    USER_GONE
}
