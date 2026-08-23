package pro.damjan.belabackend.user.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserRepository;
import pro.damjan.belabackend.user.username.GuestUsernameAllocator;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private UserRepository userRepository;
    private GuestUsernameAllocator guestUsernameAllocator;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        guestUsernameAllocator = mock(GuestUsernameAllocator.class);
        authService = new AuthService(userRepository, new BCryptPasswordEncoder(), guestUsernameAllocator);
    }

    @Test
    void loginAnonymousSavesUserWithAnAllocatedGuestName() {
        when(guestUsernameAllocator.allocate()).thenReturn("SwiftFalcon4821");
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User user = authService.loginAnonymous();

        assertThat(user.getUsername()).isEqualTo("SwiftFalcon4821");
        assertThat(user.getAuthProvider()).isEqualTo(AuthProvider.ANONYMOUS);
        assertThat(user.getRole()).isEqualTo(Role.USER);
    }

    @Test
    void loginAnonymousRetriesWithAFreshNameWhenTheNameWasTakenConcurrently() {
        when(guestUsernameAllocator.allocate()).thenReturn("SwiftFalcon4821", "QuietHeron0093");
        when(userRepository.saveAndFlush(any(User.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate username"))
                .thenAnswer(invocation -> invocation.getArgument(0));

        User user = authService.loginAnonymous();

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(2)).saveAndFlush(saved.capture());

        assertThat(saved.getAllValues()).extracting(User::getUsername)
                .containsExactly("SwiftFalcon4821", "QuietHeron0093");
        assertThat(user.getUsername()).isEqualTo("QuietHeron0093");
    }

    @Test
    void loginAnonymousPropagatesTheFailureWhenTheRetryAlsoCollides() {
        when(guestUsernameAllocator.allocate()).thenReturn("SwiftFalcon4821", "QuietHeron0093");
        when(userRepository.saveAndFlush(any(User.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate username"));

        assertThatThrownBy(() -> authService.loginAnonymous())
                .isInstanceOf(DataIntegrityViolationException.class);

        verify(userRepository, times(2)).saveAndFlush(any(User.class));
    }
}
