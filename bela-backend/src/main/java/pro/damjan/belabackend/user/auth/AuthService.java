package pro.damjan.belabackend.user.auth;

import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.user.auth.dto.request.RegisterRequest;
import pro.damjan.belabackend.exception.ExceptionResponse;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserRepository;

import java.time.Instant;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;

    public AuthService(UserRepository userRepository, BCryptPasswordEncoder bCryptPasswordEncoder) {
        this.userRepository = userRepository;
        this.bCryptPasswordEncoder = bCryptPasswordEncoder;
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

    @Transactional
    public User loginAnonymous() {
        User user = new User();
        user.setUsername("guest-" + Instant.now().toEpochMilli());
        user.setRole(Role.USER);
        user.setAuthProvider(AuthProvider.ANONYMOUS);

        return userRepository.save(user);
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
