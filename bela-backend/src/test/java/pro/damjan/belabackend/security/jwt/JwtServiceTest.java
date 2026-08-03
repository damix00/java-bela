package pro.damjan.belabackend.security.jwt;

import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "test_secret_1234567890_qwertyuiopasdfghjklzxcvbnm";
    private static final String OTHER_SECRET = "other_secret_0987654321_mnbvcxzlkjhgfdsapoiuytrewq";

    private JwtConfig jwtConfig;
    private JwtService jwtService;

    private static JwtConfig config(String secret, long accessExpirationMs) {
        JwtConfig config = new JwtConfig();
        config.setSecret(secret);
        config.setAccessExpirationMs(accessExpirationMs);
        return config;
    }

    @BeforeEach
    void setUp() {
        jwtConfig = config(SECRET, 900_000);
        jwtService = new JwtService(jwtConfig);
    }

    @Test
    void roundTripsTheSubject() {
        String token = jwtService.generateAccessToken("user-1");

        assertThat(jwtService.parseAccessToken(token)).isEqualTo("user-1");
    }

    @Test
    void rejectsATokenSignedWithADifferentSecret() {
        String foreign = new JwtService(config(OTHER_SECRET, 900_000)).generateAccessToken("user-1");

        assertThatThrownBy(() -> jwtService.parseAccessToken(foreign))
                .isInstanceOf(JwtAuthException.class)
                .extracting(e -> ((JwtAuthException) e).getError())
                .isEqualTo(TokenError.BAD_SIGNATURE);
    }

    @Test
    void distinguishesAnExpiredTokenFromAnInvalidOne() {
        String expired = new JwtService(config(SECRET, -1_000)).generateAccessToken("user-1");

        assertThatThrownBy(() -> jwtService.parseAccessToken(expired))
                .isInstanceOf(JwtAuthException.class)
                .extracting(e -> ((JwtAuthException) e).getError())
                .isEqualTo(TokenError.EXPIRED);
    }

    @Test
    void rejectsGarbageAsMalformed() {
        assertThatThrownBy(() -> jwtService.parseAccessToken("not-a-jwt"))
                .isInstanceOf(JwtAuthException.class)
                .extracting(e -> ((JwtAuthException) e).getError())
                .isEqualTo(TokenError.MALFORMED);
    }

    @Test
    void rejectsNullAndBlankAsMissing() {
        assertThatThrownBy(() -> jwtService.parseAccessToken(null))
                .isInstanceOf(JwtAuthException.class)
                .extracting(e -> ((JwtAuthException) e).getError())
                .isEqualTo(TokenError.MISSING);

        assertThatThrownBy(() -> jwtService.parseAccessToken("   "))
                .isInstanceOf(JwtAuthException.class)
                .extracting(e -> ((JwtAuthException) e).getError())
                .isEqualTo(TokenError.MISSING);
    }

    @Test
    void rejectsATokenThatIsNotAnAccessToken() {
        String wrongType = Jwts.builder()
                .subject("user-1")
                .claim("typ", "refresh")
                .expiration(new Date(System.currentTimeMillis() + 900_000))
                .signWith(jwtConfig.getJwtKey())
                .compact();

        assertThatThrownBy(() -> jwtService.parseAccessToken(wrongType))
                .isInstanceOf(JwtAuthException.class)
                .extracting(e -> ((JwtAuthException) e).getError())
                .isEqualTo(TokenError.WRONG_TYPE);
    }

    @Test
    void rejectsATokenWithNoTypeClaim() {
        String untyped = Jwts.builder()
                .subject("user-1")
                .signWith(jwtConfig.getJwtKey())
                .compact();

        assertThatThrownBy(() -> jwtService.parseAccessToken(untyped))
                .isInstanceOf(JwtAuthException.class)
                .extracting(e -> ((JwtAuthException) e).getError())
                .isEqualTo(TokenError.WRONG_TYPE);
    }

    @Test
    void getIdFromTokenReturnsNullInsteadOfThrowing() {
        assertThat(jwtService.getIdFromToken("not-a-jwt")).isNull();
        assertThat(jwtService.getIdFromToken(null)).isNull();
        assertThat(jwtService.getIdFromToken(jwtService.generateAccessToken("user-1"))).isEqualTo("user-1");
    }

    @Test
    void rejectsASecretShorterThan32Bytes() {
        JwtConfig weak = config("too-short", 900_000);

        assertThatThrownBy(weak::validate).isInstanceOf(IllegalStateException.class);
    }
}
