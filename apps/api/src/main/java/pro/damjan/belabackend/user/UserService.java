package pro.damjan.belabackend.user;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.exception.ExceptionResponse;
import pro.damjan.belabackend.user.auth.AuthProvider;
import pro.damjan.belabackend.user.dto.request.UpdateProfileRequest;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User getUserById(String userId) {
        return userRepository.findById(userId).orElse(null);
    }

    /**
     * Applies a partial profile update.
     *
     * PATCH semantics throughout: a null field was not sent and is left alone.
     * For the two free-text fields an empty string is a real value meaning
     * "clear it" — a player who has written a bio needs a way to unwrite it, and
     * a blank box is how they will try.
     *
     * The username collision is raised the same way {@code AuthService.register}
     * raises it, message included, so the web app's `localiseAuthError` maps it
     * to the copy it already has.
     *
     * Anonymous accounts are turned away outright. A guest is a name the server
     * handed out for a day, not a profile someone owns — letting one be renamed
     * would put a name a player chose behind a session that expires and takes it
     * with it, and would let the guest pool be used to squat real usernames.
     */
    @Transactional
    public User updateProfile(User user, UpdateProfileRequest request) throws ExceptionResponse {
        if (user.getAuthProvider() == AuthProvider.ANONYMOUS) {
            throw new ExceptionResponse(HttpStatus.FORBIDDEN, "Guest accounts have no profile");
        }

        String username = request.getUsername();
        if (username != null) {
            String trimmed = username.trim();

            // Renaming to the name you already hold is a no-op, not a collision
            // with yourself.
            if (!trimmed.equals(user.getUsername())) {
                if (userRepository.existsByUsername(trimmed)) {
                    throw new ExceptionResponse(HttpStatus.BAD_REQUEST, "Username already exists");
                }

                user.setUsername(trimmed);
            }
        }

        if (request.getBio() != null) {
            String bio = request.getBio().trim();
            user.setBio(bio.isEmpty() ? null : bio);
        }

        if (request.getCountryCode() != null) {
            String country = request.getCountryCode().trim();
            user.setCountryCode(country.isEmpty() ? null : country.toUpperCase());
        }

        return userRepository.save(user);
    }
}
