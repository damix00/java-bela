package pro.damjan.belabackend.user.auth;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.security.jwt.JwtConfig;
import pro.damjan.belabackend.security.jwt.JwtService;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.auth.dto.response.AuthResponse;
import pro.damjan.belabackend.user.auth.dto.response.UserResponse;
import pro.damjan.belabackend.user.auth.refresh.IssuedRefreshToken;
import pro.damjan.belabackend.user.auth.refresh.RefreshTokenService;
import pro.damjan.belabackend.user.auth.refresh.RotationResult;

import java.time.Duration;

/** Single place where a User is turned into a token pair, shared by login, register and refresh. */
@Service
public class TokenIssuanceService {

    private final JwtService jwtService;
    private final JwtConfig jwtConfig;
    private final RefreshTokenService refreshTokenService;

    public TokenIssuanceService(JwtService jwtService,
                                JwtConfig jwtConfig,
                                RefreshTokenService refreshTokenService) {
        this.jwtService = jwtService;
        this.jwtConfig = jwtConfig;
        this.refreshTokenService = refreshTokenService;
    }

    public AuthResponse issueFor(User user, HttpServletRequest request) {
        IssuedRefreshToken refresh = refreshTokenService.issue(
                user, null, userAgentOf(request), ipAddressOf(request));

        return build(user, refresh.raw(), refresh.expiresInSeconds());
    }

    public AuthResponse fromRotation(RotationResult rotation) {
        return build(rotation.user(), rotation.newRefreshToken(), rotation.refreshExpiresInSeconds());
    }

    private AuthResponse build(User user, String refreshToken, long refreshExpiresInSeconds) {
        AuthResponse response = new AuthResponse();
        response.setAccessToken(jwtService.generateAccessToken(user.getId()));
        response.setExpiresIn(Duration.ofMillis(jwtConfig.getAccessExpirationMs()).toSeconds());
        response.setRefreshToken(refreshToken);
        response.setRefreshExpiresIn(refreshToken == null ? 0 : refreshExpiresInSeconds);
        response.setUser(UserResponse.fromUser(user));
        return response;
    }

    private static String userAgentOf(HttpServletRequest request) {
        return request == null ? null : request.getHeader("User-Agent");
    }

    private static String ipAddressOf(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }
}
