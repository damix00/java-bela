package pro.damjan.belabackend.auth.security;

import io.jsonwebtoken.security.Keys;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.security.Key;

@Configuration
@ConfigurationProperties(prefix = "app.jwt")
@Getter
@Setter
public class JwtConfig {
    private String secret;
    private long expirationMs;

    public Key getJwtKey() {
        return Keys.hmacShaKeyFor(this.secret.getBytes());
    }
}