package pro.damjan.belabackend.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;

@Slf4j
@Service
public class JwtService {

    private final JwtConfig jwtConfig;

    public JwtService(JwtConfig jwtConfig) {
        this.jwtConfig = jwtConfig;
    }

    public String generateToken(String userId) {
        return Jwts.builder()
                .subject(userId)
                .signWith(jwtConfig.getJwtKey())
                .compact();
    }

    public String getIdFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith((SecretKey) jwtConfig.getJwtKey())
                    .build().parseSignedClaims(token).getPayload();

            return claims.getSubject();
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return null;
        }
    }

}
