package pro.damjan.belabackend.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SecurityException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Service
public class JwtService {

    static final String TYPE_CLAIM = "typ";
    static final String ACCESS_TYPE = "access";

    private final JwtConfig jwtConfig;

    public JwtService(JwtConfig jwtConfig) {
        this.jwtConfig = jwtConfig;
    }

    public String generateAccessToken(String userId) {
        Instant now = Instant.now();

        return Jwts.builder()
                .subject(userId)
                .id(UUID.randomUUID().toString())
                .claim(TYPE_CLAIM, ACCESS_TYPE)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(jwtConfig.getAccessExpirationMs())))
                .signWith(jwtConfig.getJwtKey())
                .compact();
    }

    /**
     * Verifies an access token and returns its subject.
     *
     * @throws JwtAuthException with a specific TokenError, so callers can tell an expired
     *                          token (refresh me) from a forged one (log me out).
     */
    public String parseAccessToken(String token) {
        if (token == null || token.isBlank()) {
            throw new JwtAuthException(TokenError.MISSING, "No token provided");
        }

        Claims claims;
        try {
            claims = Jwts.parser()
                    .verifyWith(jwtConfig.getJwtKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            throw new JwtAuthException(TokenError.EXPIRED, "Token expired");
        } catch (SecurityException e) {
            // SignatureException extends SecurityException in jjwt, so this covers both
            throw new JwtAuthException(TokenError.BAD_SIGNATURE, "Token signature does not match");
        } catch (MalformedJwtException | IllegalArgumentException e) {
            throw new JwtAuthException(TokenError.MALFORMED, "Token is malformed");
        }

        if (!ACCESS_TYPE.equals(claims.get(TYPE_CLAIM))) {
            throw new JwtAuthException(TokenError.WRONG_TYPE, "Token is not an access token");
        }

        String subject = claims.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new JwtAuthException(TokenError.MALFORMED, "Token has no subject");
        }

        return subject;
    }

    /**
     * Nullable convenience wrapper for callers that cannot propagate an exception —
     * currently only the WebSocket handshake interceptor.
     */
    public String getIdFromToken(String token) {
        try {
            return parseAccessToken(token);
        } catch (JwtAuthException e) {
            log.debug("Rejected token: {} ({})", e.getError(), e.getMessage());
            return null;
        }
    }
}
