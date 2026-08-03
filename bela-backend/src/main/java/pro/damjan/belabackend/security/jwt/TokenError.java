package pro.damjan.belabackend.security.jwt;

public enum TokenError {
    MISSING,
    MALFORMED,
    BAD_SIGNATURE,
    EXPIRED,
    WRONG_TYPE
}
