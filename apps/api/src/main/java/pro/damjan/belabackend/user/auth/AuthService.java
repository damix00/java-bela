package pro.damjan.belabackend.user.auth;

import jakarta.transaction.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.user.auth.dto.request.RegisterRequest;
import pro.damjan.belabackend.exception.ExceptionResponse;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserRepository;
import pro.damjan.belabackend.user.username.GuestUsernameAllocator;

import java.time.Instant;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final GuestUsernameAllocator guestUsernameAllocator;

    public AuthService(UserRepository userRepository,
                       BCryptPasswordEncoder bCryptPasswordEncoder,
                       GuestUsernameAllocator guestUsernameAllocator) {
        this.userRepository = userRepository;
        this.bCryptPasswordEncoder = bCryptPasswordEncoder;
        this.guestUsernameAllocator = guestUsernameAllocator;
    }

    @Transactional
    public User register(RegisterRequest request) throws ExceptionResponse {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new ExceptionResponse(HttpStatus.BAD_REQUEST, "Username already exists");
        }

        else if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ExceptionResponse(HttpStatus.BAD_REQUEST, "Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(bCryptPasswordEncoder.encode(request.getPassword()));
        user.setRole(Role.USER);
        user.setAuthProvider(AuthProvider.LOCAL);

        return userRepository.save(user);
    }

    /**
     * Deliberately not {@code @Transactional}: each {@code saveAndFlush} runs in its own
     * transaction, so a unique-constraint violation on the first attempt does not leave a
     * rollback-only transaction that would doom the retry.
     */
    public User loginAnonymous() {
        try {
            return saveAnonymousUser(guestUsernameAllocator.allocate());
        } catch (DataIntegrityViolationException e) {
            // Another instance can claim the same name between the availability check and the
            // insert. One fresh name is enough to settle that race in practice.
            return saveAnonymousUser(guestUsernameAllocator.allocate());
        }
    }

    private User saveAnonymousUser(String username) {
        User user = new User();
        user.setUsername(username);
        user.setRole(Role.USER);
        user.setAuthProvider(AuthProvider.ANONYMOUS);

        return userRepository.saveAndFlush(user);
    }

    public User login(String email, String password) throws InvalidLoginException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(InvalidLoginException::new);

        if (!bCryptPasswordEncoder.matches(password, user.getPassword())) {
            throw new InvalidLoginException();
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        return user;
    }
}
