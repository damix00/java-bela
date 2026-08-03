package pro.damjan.belabackend.security.jwt;

import lombok.Getter;

/**
 * Thrown when an access token cannot be accepted. Deliberately a plain RuntimeException:
 * it is thrown from a servlet filter, where @RestControllerAdvice cannot see it, so the
 * filter writes the 401 itself via AuthErrorWriter.
 */
@Getter
public class JwtAuthException extends RuntimeException {

    private final TokenError error;

    public JwtAuthException(TokenError error, String message) {
        super(message);
        this.error = error;
    }
}
