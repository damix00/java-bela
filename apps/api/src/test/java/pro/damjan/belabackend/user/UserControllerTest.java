package pro.damjan.belabackend.user;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.exception.codes.NotFoundException;
import pro.damjan.belabackend.user.auth.AuthProvider;
import pro.damjan.belabackend.user.auth.Role;
import pro.damjan.belabackend.user.dto.response.PublicUserResponse;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserControllerTest {

    private UserService userService;
    private UserController userController;

    @BeforeEach
    void setUp() {
        userService = mock(UserService.class);
        userController = new UserController(userService);
    }

    @Test
    void returnsOnlyThePublicProfileFieldsForAUsername() {
        Instant createdAt = Instant.parse("2026-09-17T12:00:00Z");
        User user = new User();
        user.setId("user-id");
        user.setUsername("Kruno");
        user.setAvatarUrl("https://cdn.example/avatar.png");
        user.setBio("Plays the fours.");
        user.setCountryCode("HR");
        user.setCreatedAt(createdAt);
        user.setEmail("private@example.com");
        user.setRole(Role.ADMIN);
        user.setAuthProvider(AuthProvider.LOCAL);

        when(userService.getUserByUsername("Kruno")).thenReturn(user);

        PublicUserResponse response = userController.getUserByUsername("Kruno");

        assertThat(response.getId()).isEqualTo("user-id");
        assertThat(response.getUsername()).isEqualTo("Kruno");
        assertThat(response.getAvatarUrl()).isEqualTo("https://cdn.example/avatar.png");
        assertThat(response.getBio()).isEqualTo("Plays the fours.");
        assertThat(response.getCountryCode()).isEqualTo("HR");
        assertThat(response.getCreatedAt()).isEqualTo(createdAt);
        assertThat(publicResponseFields()).containsExactlyInAnyOrder(
                "id",
                "username",
                "avatarUrl",
                "bio",
                "countryCode",
                "createdAt"
        );
        verify(userService).getUserByUsername("Kruno");
    }

    @Test
    void aMissingUsernameRaisesNotFound() {
        when(userService.getUserByUsername("Nobody")).thenReturn(null);

        assertThatThrownBy(() -> userController.getUserByUsername("Nobody"))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Not Found");
        verify(userService).getUserByUsername("Nobody");
    }

    private Set<String> publicResponseFields() {
        return Stream.of(PublicUserResponse.class.getDeclaredFields())
                .map(Field::getName)
                .collect(Collectors.toSet());
    }
}
