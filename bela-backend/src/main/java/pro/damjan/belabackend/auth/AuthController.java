package pro.damjan.belabackend.auth;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import pro.damjan.belabackend.auth.dto.response.AuthResponse;
import pro.damjan.belabackend.auth.dto.request.LoginRequest;
import pro.damjan.belabackend.auth.dto.request.RegisterRequest;
import pro.damjan.belabackend.auth.dto.response.UserResponse;
import pro.damjan.belabackend.auth.jwt.JwtService;
import pro.damjan.belabackend.user.User;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest request) {
        User user = authService.register(request);
        String jwt = jwtService.generateToken(user);

        return AuthResponse.fromUserAndToken(
                user,
                jwt
        );
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        User user = authService.login(request.getUsernameOrEmail(), request.getPassword());
        String jwt = jwtService.generateToken(user);

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
