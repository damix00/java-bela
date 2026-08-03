package pro.damjan.belabackend.user.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import pro.damjan.belabackend.security.ratelimit.RateLimit;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.auth.dto.request.LoginRequest;
import pro.damjan.belabackend.user.auth.dto.request.LogoutRequest;
import pro.damjan.belabackend.user.auth.dto.request.RefreshRequest;
import pro.damjan.belabackend.user.auth.dto.request.RegisterRequest;
import pro.damjan.belabackend.user.auth.dto.response.AuthResponse;
import pro.damjan.belabackend.user.auth.dto.response.UserResponse;
import pro.damjan.belabackend.user.auth.refresh.RefreshTokenService;
import pro.damjan.belabackend.user.auth.refresh.RotationResult;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final TokenIssuanceService tokenIssuanceService;
    private final RefreshTokenService refreshTokenService;

    public AuthController(AuthService authService,
                          TokenIssuanceService tokenIssuanceService,
                          RefreshTokenService refreshTokenService) {
        this.authService = authService;
        this.tokenIssuanceService = tokenIssuanceService;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/register")
    @RateLimit(
            keyPrefix = "register",
            user = @RateLimit.Limit(
                    enabled = false
            ),
            ip = @RateLimit.Limit(
                    enabled = true,
                    limit = 5,
                    windowSeconds = 3600,
                    limitSuccess = true
            )
    )
    public AuthResponse register(@Valid @RequestBody RegisterRequest request, HttpServletRequest servletRequest) {
        User user = authService.register(request);

        return tokenIssuanceService.issueFor(user, servletRequest);
    }

    @PostMapping("/login")
    @RateLimit(
            keyPrefix = "login",
            user = @RateLimit.Limit(
                    enabled = false
            ),
            ip = @RateLimit.Limit(
                    enabled = true,
                    limit = 10,
                    windowSeconds = 60,
                    limitSuccess = false
            )
    )
    public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        User user = authService.login(request.getEmail(), request.getPassword());

        return tokenIssuanceService.issueFor(user, servletRequest);
    }

    @PostMapping("/login/anonymous")
    @RateLimit(
            keyPrefix = "login_anonymous",
            user = @RateLimit.Limit(
                    enabled = false
            ),
            ip = @RateLimit.Limit(
                    enabled = true,
                    limit = 5,
                    windowSeconds = 3600,
                    limitSuccess = true
            )
    )
    public AuthResponse loginAnonymous(HttpServletRequest servletRequest) {
        User user = authService.loginAnonymous();

        return tokenIssuanceService.issueFor(user, servletRequest);
    }

    /**
     * Deliberately does not require an access token — by the time a client needs to refresh,
     * its access token is expired by definition.
     */
    @PostMapping("/refresh")
    @RateLimit(
            keyPrefix = "refresh",
            user = @RateLimit.Limit(
                    enabled = false
            ),
            ip = @RateLimit.Limit(
                    enabled = true,
                    limit = 120,
                    windowSeconds = 60,
                    limitSuccess = false
            )
    )
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request, HttpServletRequest servletRequest) {
        RotationResult rotation = refreshTokenService.rotate(
                request.getRefreshToken(),
                servletRequest.getHeader("User-Agent"),
                servletRequest.getRemoteAddr()
        );

        return tokenIssuanceService.fromRotation(rotation);
    }

    /** Also unauthenticated: logging out with an already-expired access token is the normal case. */
    @PostMapping("/logout")
    @RateLimit(
            keyPrefix = "logout",
            user = @RateLimit.Limit(
                    enabled = false
            ),
            ip = @RateLimit.Limit(
                    enabled = true,
                    limit = 60,
                    windowSeconds = 60,
                    limitSuccess = false
            )
    )
    public ResponseEntity<Void> logout(@RequestBody(required = false) LogoutRequest request) {
        if (request != null) {
            refreshTokenService.revokeFamilyOf(request.getRefreshToken());
        }

        return ResponseEntity.noContent().build();
    }

    /** Revoking every session is sensitive, so this one does require a live access token. */
    @PostMapping("/logout-all")
    @RateLimit(
            keyPrefix = "logout_all",
            user = @RateLimit.Limit(
                    enabled = true,
                    limit = 10,
                    windowSeconds = 3600,
                    limitSuccess = false
            ),
            ip = @RateLimit.Limit(
                    enabled = false
            )
    )
    public ResponseEntity<Void> logoutAll(@AuthenticationPrincipal User user) {
        refreshTokenService.revokeAllForUser(user.getId());

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal User user) {
        return UserResponse.fromUser(user);
    }
}
