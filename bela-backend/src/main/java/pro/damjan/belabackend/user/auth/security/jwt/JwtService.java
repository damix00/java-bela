package pro.damjan.belabackend.user.auth.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.user.User;

@Slf4j
@Service
public class JwtService {

    private final JwtConfig jwtConfig;

    public JwtService(JwtConfig jwtConfig) {
        this.jwtConfig = jwtConfig;
    }

    public String generateToken(User user) {
        return Jwts.builder()
                .subject(user.getId())
                .signWith(jwtConfig.getJwtKey())
                .compact();
    }

    public String getIdFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(jwtConfig.getJwtKey())
                    .build()
                    .parseClaimsJws(token).getBody();

            return claims.getSubject();
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return null;
        }
    }

}
