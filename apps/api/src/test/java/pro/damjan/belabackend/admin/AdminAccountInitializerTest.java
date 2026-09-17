package pro.damjan.belabackend.admin;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserRepository;
import pro.damjan.belabackend.user.auth.AuthProvider;
import pro.damjan.belabackend.user.auth.Role;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class AdminAccountInitializerTest {

    private static final String ADMIN_EMAIL = "damjan.pavlicevic1@gmail.com";

    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
    }

    @Test
    void doesNothingWhenNoAdminEmailIsConfigured() {
        new AdminAccountInitializer(userRepository, " ").run(null);

        verifyNoInteractions(userRepository);
    }

    @Test
    void promotesTheMatchingLocalAccountOnStartup() {
        User user = localUser(Role.USER);
        when(userRepository.findByEmailIgnoreCaseAndAuthProvider(ADMIN_EMAIL, AuthProvider.LOCAL))
                .thenReturn(Optional.of(user));

        new AdminAccountInitializer(userRepository, "  " + ADMIN_EMAIL + "  ").run(null);

        assertThat(user.getRole()).isEqualTo(Role.ADMIN);
        verify(userRepository).save(user);
    }

    @Test
    void leavesAnExistingAdminUnchanged() {
        User user = localUser(Role.ADMIN);
        when(userRepository.findByEmailIgnoreCaseAndAuthProvider(ADMIN_EMAIL, AuthProvider.LOCAL))
                .thenReturn(Optional.of(user));

        new AdminAccountInitializer(userRepository, ADMIN_EMAIL).run(null);

        verify(userRepository, never()).save(user);
    }

    @Test
    void doesNotCreateAnAccountWhenTheEmailIsMissing() {
        when(userRepository.findByEmailIgnoreCaseAndAuthProvider(ADMIN_EMAIL, AuthProvider.LOCAL))
                .thenReturn(Optional.empty());

        new AdminAccountInitializer(userRepository, ADMIN_EMAIL).run(null);

        verify(userRepository, never()).save(any());
    }

    private static User localUser(Role role) {
        User user = new User();
        user.setEmail(ADMIN_EMAIL);
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setRole(role);
        return user;
    }
}
