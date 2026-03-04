package pro.damjan.belabackend.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import pro.damjan.belabackend.auth.dto.request.RegisterRequest;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, bCryptPasswordEncoder);
    }

    // --- register ---

    @Test
    void register_success() {
        RegisterRequest request = new RegisterRequest("john", "john@example.com", "pass123");

        when(userRepository.findByUsername("john")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.empty());
        when(bCryptPasswordEncoder.encode("pass123")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = authService.register(request);

        assertEquals("john", result.getUsername());
        assertEquals("john@example.com", result.getEmail());
        assertEquals("hashed", result.getPassword());
        assertEquals(Role.USER, result.getRole());
        assertEquals(AuthProvider.LOCAL, result.getAuthProvider());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_throwsWhenUsernameAlreadyExists() {
        RegisterRequest request = new RegisterRequest("john", "john@example.com", "pass123");
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(new User()));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.register(request));
        assertEquals("Username already exists", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_throwsWhenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest("john", "john@example.com", "pass123");
        when(userRepository.findByUsername("john")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(new User()));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.register(request));
        assertEquals("Email already exists", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    // --- login ---

    @Test
    void login_successWithUsername() {
        User user = new User();
        user.setUsername("john");
        user.setPassword("hashed");

        when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));
        when(bCryptPasswordEncoder.matches("pass123", "hashed")).thenReturn(true);

        User result = authService.login("john", "pass123");

        assertSame(user, result);
    }

    @Test
    void login_successWithEmail() {
        User user = new User();
        user.setEmail("john@example.com");
        user.setPassword("hashed");

        when(userRepository.findByUsername("john@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(bCryptPasswordEncoder.matches("pass123", "hashed")).thenReturn(true);

        User result = authService.login("john@example.com", "pass123");

        assertSame(user, result);
    }

    @Test
    void login_throwsWhenUserNotFound() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("unknown")).thenReturn(Optional.empty());

        assertThrows(InvalidLoginException.class, () -> authService.login("unknown", "pass"));
    }

    @Test
    void login_throwsWhenPasswordIncorrect() {
        User user = new User();
        user.setPassword("hashed");

        when(userRepository.findByUsername("john")).thenReturn(Optional.of(user));
        when(bCryptPasswordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThrows(InvalidLoginException.class, () -> authService.login("john", "wrong"));
    }
}

