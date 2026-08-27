package pro.damjan.belabackend.user;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.exception.ExceptionResponse;
import pro.damjan.belabackend.user.auth.AuthProvider;
import pro.damjan.belabackend.user.dto.request.UpdateProfileRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserServiceTest {

    private UserRepository userRepository;
    private UserService userService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        userService = new UserService(userRepository);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private User existingUser() {
        User user = new User();
        user.setUsername("Kruno");
        user.setBio("Plays the fours.");
        user.setCountryCode("HR");

        return user;
    }

    @Test
    void aGuestHasNoProfileToEdit() {
        User guest = existingUser();
        guest.setAuthProvider(AuthProvider.ANONYMOUS);

        assertThatThrownBy(() -> userService.updateProfile(guest, new UpdateProfileRequest("Marko", null, null)))
                .isInstanceOf(ExceptionResponse.class)
                .hasMessage("Guest accounts have no profile");

        assertThat(guest.getUsername()).isEqualTo("Kruno");
        verify(userRepository, never()).save(any());
    }

    @Test
    void aNullFieldLeavesTheStoredValueAlone() {
        User user = existingUser();

        User updated = userService.updateProfile(user, new UpdateProfileRequest(null, "Zove i pada.", null));

        assertThat(updated.getUsername()).isEqualTo("Kruno");
        assertThat(updated.getBio()).isEqualTo("Zove i pada.");
        assertThat(updated.getCountryCode()).isEqualTo("HR");
    }

    @Test
    void anEmptyBioClearsIt() {
        User user = existingUser();

        User updated = userService.updateProfile(user, new UpdateProfileRequest(null, "   ", null));

        assertThat(updated.getBio()).isNull();
    }

    @Test
    void anEmptyCountryClearsIt() {
        User user = existingUser();

        User updated = userService.updateProfile(user, new UpdateProfileRequest(null, null, ""));

        assertThat(updated.getCountryCode()).isNull();
    }

    @Test
    void theCountryCodeIsStoredUppercase() {
        User user = existingUser();

        User updated = userService.updateProfile(user, new UpdateProfileRequest(null, null, "de"));

        assertThat(updated.getCountryCode()).isEqualTo("DE");
    }

    @Test
    void keepingTheSameUsernameIsNotACollisionWithYourself() {
        User user = existingUser();

        User updated = userService.updateProfile(user, new UpdateProfileRequest("Kruno", null, null));

        assertThat(updated.getUsername()).isEqualTo("Kruno");
        verify(userRepository, never()).existsByUsername(any());
    }

    @Test
    void aUsernameSomeoneElseHoldsIsRejected() {
        User user = existingUser();
        when(userRepository.existsByUsername("Marko")).thenReturn(true);

        assertThatThrownBy(() -> userService.updateProfile(user, new UpdateProfileRequest("Marko", null, null)))
                .isInstanceOf(ExceptionResponse.class)
                .hasMessage("Username already exists");

        assertThat(user.getUsername()).isEqualTo("Kruno");
        verify(userRepository, never()).save(any());
    }

    @Test
    void aFreeUsernameIsTaken() {
        User user = existingUser();
        when(userRepository.existsByUsername("Marko")).thenReturn(false);

        User updated = userService.updateProfile(user, new UpdateProfileRequest("  Marko  ", null, null));

        assertThat(updated.getUsername()).isEqualTo("Marko");
    }
}
