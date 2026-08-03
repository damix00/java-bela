package pro.damjan.belabackend.security.jwt;

import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Configuration
@ConfigurationProperties(prefix = "app.jwt")
@Getter
@Setter
public class JwtConfig {

    /** HMAC secret. Must be at least 32 bytes, otherwise jjwt rejects it as a weak key. */
    private String secret;

    /** Lifetime of an access token. Short by design: refresh tokens carry the session. */
    private long accessExpirationMs;

    /** Lifetime of a refresh token issued to a registered user. */
    private long refreshExpirationMs;

    /**
     * Lifetime of a refresh token issued to an anonymous guest. Kept in step with
     * UserCleanupService, which deletes guest accounts after 24h — handing a guest a
     * 30 day token for a row that disappears tomorrow would be a lie.
     */
    private long refreshAnonymousExpirationMs;

    /**
     * How long a just-rotated refresh token keeps working. Two tabs share one cookie jar,
     * so the loser of a rotation race must still get a usable access token instead of
     * being treated as a token thief.
     */
    private long refreshGraceMs;

    @PostConstruct
    void validate() {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "app.jwt.secret must be at least 32 bytes; set the JWT_SECRET environment variable");
        }
    }

    public SecretKey getJwtKey() {
        return Keys.hmacShaKeyFor(this.secret.getBytes(StandardCharsets.UTF_8));
    }
}
