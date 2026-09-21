package pro.damjan.belabackend.friendships;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import pro.damjan.belabackend.friendships.dto.request.RespondToFriendRequest;
import pro.damjan.belabackend.user.User;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class FriendshipControllerTest {

    private FriendshipService friendshipService;
    private FriendshipController friendshipController;
    private User authenticatedUser;

    @BeforeEach
    void setUp() {
        friendshipService = mock(FriendshipService.class);
        friendshipController = new FriendshipController(friendshipService);
        authenticatedUser = new User();
        authenticatedUser.setId("authenticated-user");
    }

    @Test
    void sendsFriendRequestAsAuthenticatedUser() {
        var response = friendshipController.sendFriendRequest(authenticatedUser, "receiver");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        verify(friendshipService).sendFriendRequest(authenticatedUser, "receiver");
    }

    @Test
    void passesFriendRequestDecisionToService() {
        RespondToFriendRequest request = new RespondToFriendRequest();
        request.setAccepted(true);

        var response = friendshipController.respondToFriendRequest(
                authenticatedUser,
                "requester",
                request
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(friendshipService).respondToFriendRequest(authenticatedUser, "requester", true);
    }

    @Test
    void unfriendsAsAuthenticatedUser() {
        var response = friendshipController.unfriend(authenticatedUser, "friend");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(friendshipService).unfriend(authenticatedUser, "friend");
    }
}
