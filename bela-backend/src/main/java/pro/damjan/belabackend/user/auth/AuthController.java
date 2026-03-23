package pro.damjan.belabackend.user.auth;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import pro.damjan.belabackend.user.auth.dto.response.AuthResponse;
import pro.damjan.belabackend.user.auth.dto.request.LoginRequest;
import pro.damjan.belabackend.user.auth.dto.request.RegisterRequest;
import pro.damjan.belabackend.user.auth.dto.response.UserResponse;
import pro.damjan.belabackend.security.ratelimit.InternalSourceService;
import pro.damjan.belabackend.security.jwt.JwtService;
import pro.damjan.belabackend.security.ratelimit.RateLimit;
import pro.damjan.belabackend.user.User;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final InternalSourceService internalSourceService;

    public AuthController(AuthService authService, JwtService jwtService, InternalSourceService internalSourceService) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.internalSourceService = internalSourceService;
    }

    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest request) {
        User user = authService.register(request);
        String jwt = jwtService.generateToken(user.getId());

        return AuthResponse.fromUserAndToken(
                user,
                jwt
        );
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
    public AuthResponse login(@RequestBody LoginRequest request) {
        User user = authService.login(request.getUsernameOrEmail(), request.getPassword());
        String jwt = jwtService.generateToken(user.getId());

        return AuthResponse.fromUserAndToken(
                user,
                jwt
        );
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@AuthenticationPrincipal User user) {
        String jwt = jwtService.generateToken(user.getId());

        return AuthResponse.fromUserAndToken(
                user,
                jwt
        );
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal User user) {
        return UserResponse.fromUser(user);
    }
}
