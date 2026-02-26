package pro.damjan.belabackend.auth.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserRepository;

import java.util.Optional;

@Service
public class JwtService {

    private final JwtConfig jwtConfig;
    private final UserRepository userRepository;

    public JwtService(JwtConfig jwtConfig, UserRepository userRepository) {
        this.jwtConfig = jwtConfig;
        this.userRepository = userRepository;
    }

    public String generateToken(User user) {
        return Jwts.builder()
                .subject(user.getId())
                .signWith(jwtConfig.getJwtKey())
                .compact();
    }

    public String getIdFromToken(String token) {
        Claims claims = Jwts.parser()
                .setSigningKey(jwtConfig.getJwtKey())
                .build()
                .parseClaimsJws(token).getBody();

        return claims.getSubject();
    }

    public User authenticateToken(String token) {
        Claims claims = Jwts.parser()
                .setSigningKey(jwtConfig.getJwtKey())
                .build()
                .parseClaimsJws(token).getBody();

        String subject = claims.getSubject();

        return userRepository.findById(subject).orElse(null);
    }
}
