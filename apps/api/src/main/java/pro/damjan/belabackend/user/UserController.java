package pro.damjan.belabackend.user;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pro.damjan.belabackend.exception.codes.NotFoundException;
import pro.damjan.belabackend.security.ratelimit.RateLimit;
import pro.damjan.belabackend.user.auth.dto.response.UserResponse;
import pro.damjan.belabackend.user.dto.request.UpdateProfileRequest;
import pro.damjan.belabackend.user.dto.response.PublicUserResponse;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public PublicUserResponse getUserById(@PathVariable String id) {
        User user = userService.getUserById(id);

        if (user == null) {
            throw new NotFoundException();
        }

        return PublicUserResponse.fromUser(user);
    }

    /**
     * Edits the caller's own profile. Returns the full {@link UserResponse} rather
     * than 204, because the web app mirrors it into its session cookie and would
     * otherwise have to go and fetch what it just wrote.
     *
     * Limited per user, not per IP: two players behind one household address
     * editing their names is not the thing worth stopping.
     */
    @PatchMapping("/me")
    @RateLimit(
            keyPrefix = "update_profile",
            user = @RateLimit.Limit(
                    enabled = true,
                    limit = 20,
                    windowSeconds = 3600,
                    limitSuccess = true
            ),
            ip = @RateLimit.Limit(
                    enabled = false
            )
    )
    public UserResponse updateMe(@AuthenticationPrincipal User user,
                                 @Valid @RequestBody UpdateProfileRequest request) {
        return UserResponse.fromUser(userService.updateProfile(user, request));
    }
}
