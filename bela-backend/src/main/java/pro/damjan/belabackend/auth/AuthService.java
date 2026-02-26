package pro.damjan.belabackend.auth;

import jakarta.transaction.Transactional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.auth.dto.RegisterRequest;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;

    public AuthService(UserRepository userRepository, BCryptPasswordEncoder bCryptPasswordEncoder) {
        this.userRepository = userRepository;
        this.bCryptPasswordEncoder = bCryptPasswordEncoder;
    }

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        else if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(bCryptPasswordEncoder.encode(request.getPassword()));
        user.setRole(Role.USER);
        user.setAuthProvider(AuthProvider.LOCAL);

        return userRepository.save(user);
    }

    public User login(String usernameOrEmail, String password) throws InvalidLoginException {
        User user = userRepository.findByUsername(usernameOrEmail)
                .orElseGet(() -> userRepository.findByEmail(usernameOrEmail)
                        .orElseThrow(() -> new InvalidLoginException("Invalid login")));

        if (!bCryptPasswordEncoder.matches(password, user.getPassword())) {
            throw new InvalidLoginException("Invalid login");
        }

        return user;
    }
}
