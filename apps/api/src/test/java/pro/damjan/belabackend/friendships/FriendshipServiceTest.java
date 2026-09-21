package pro.damjan.belabackend.friendships;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.exception.ExceptionResponse;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserRepository;
import pro.damjan.belabackend.user.dto.response.UserProfileResponse;
import pro.damjan.belabackend.user.presence.UserPresenceService;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FriendshipServiceTest {

    private FriendshipRepository friendshipRepository;
    private UserRepository userRepository;
    private UserPresenceService userPresenceService;
    private FriendshipService friendshipService;

    @BeforeEach
    void setUp() {
        friendshipRepository = mock(FriendshipRepository.class);
        userRepository = mock(UserRepository.class);
        userPresenceService = mock(UserPresenceService.class);
        friendshipService = new FriendshipService(
                friendshipRepository,
                userRepository,
                userPresenceService
        );
    }

    @Test
    void sendsANewFriendRequest() {
        User requester = user("requester");
        User receiver = user("receiver");
        when(userRepository.findById("receiver")).thenReturn(Optional.of(receiver));
        when(friendshipRepository.findBetween(requester, receiver)).thenReturn(Optional.empty());

        friendshipService.sendFriendRequest(requester, "receiver");

        verify(friendshipRepository).saveAndFlush(any(Friendship.class));
    }

    @Test
    void rejectsRequestsToSelf() {
        User requester = user("same-user");
        when(userRepository.findById("same-user")).thenReturn(Optional.of(requester));

        assertThatThrownBy(() -> friendshipService.sendFriendRequest(requester, "same-user"))
                .isInstanceOf(ExceptionResponse.class)
                .hasMessage("You cannot send a friend request to yourself");
        verify(friendshipRepository, never()).saveAndFlush(any());
    }

    @Test
    void rejectsDuplicateOrReverseRequests() {
        User requester = user("requester");
        User receiver = user("receiver");
        Friendship existing = friendship(requester, receiver, FriendshipStatus.WAITING);
        when(userRepository.findById("receiver")).thenReturn(Optional.of(receiver));
        when(friendshipRepository.findBetween(requester, receiver)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> friendshipService.sendFriendRequest(requester, "receiver"))
                .isInstanceOf(ExceptionResponse.class)
                .hasMessage("A friendship or friend request already exists");
        verify(friendshipRepository, never()).saveAndFlush(any());
    }

    @Test
    void recipientCanAcceptAWaitingRequest() {
        User requester = user("requester");
        User receiver = user("receiver");
        Friendship request = friendship(requester, receiver, FriendshipStatus.WAITING);
        when(userRepository.findById("requester")).thenReturn(Optional.of(requester));
        when(friendshipRepository.findByRequesterAndReceiverAndStatus(
                requester, receiver, FriendshipStatus.WAITING
        )).thenReturn(Optional.of(request));

        friendshipService.respondToFriendRequest(receiver, "requester", true);

        assertThat(request.getStatus()).isEqualTo(FriendshipStatus.ACCEPTED);
        verify(friendshipRepository, never()).delete(request);
    }

    @Test
    void recipientCanRejectAWaitingRequest() {
        User requester = user("requester");
        User receiver = user("receiver");
        Friendship request = friendship(requester, receiver, FriendshipStatus.WAITING);
        when(userRepository.findById("requester")).thenReturn(Optional.of(requester));
        when(friendshipRepository.findByRequesterAndReceiverAndStatus(
                requester, receiver, FriendshipStatus.WAITING
        )).thenReturn(Optional.of(request));

        friendshipService.respondToFriendRequest(receiver, "requester", false);

        verify(friendshipRepository).delete(request);
    }

    @Test
    void nonRecipientCannotRespondToARequest() {
        User requester = user("requester");
        User otherUser = user("other");
        when(userRepository.findById("requester")).thenReturn(Optional.of(requester));
        when(friendshipRepository.findByRequesterAndReceiverAndStatus(
                requester, otherUser, FriendshipStatus.WAITING
        )).thenReturn(Optional.empty());

        assertThatThrownBy(() -> friendshipService.respondToFriendRequest(otherUser, "requester", true))
                .isInstanceOf(ExceptionResponse.class)
                .hasMessage("Friend request not found");
    }

    @Test
    void eitherParticipantCanUnfriend() {
        User firstUser = user("first");
        User secondUser = user("second");
        Friendship friendship = friendship(firstUser, secondUser, FriendshipStatus.ACCEPTED);
        when(userRepository.findById("first")).thenReturn(Optional.of(firstUser));
        when(friendshipRepository.findBetween(secondUser, firstUser)).thenReturn(Optional.of(friendship));

        friendshipService.unfriend(secondUser, "first");

        verify(friendshipRepository).delete(friendship);
    }

    @Test
    void pendingRequestCannotBeRemovedThroughUnfriendEndpoint() {
        User requester = user("requester");
        User receiver = user("receiver");
        Friendship request = friendship(requester, receiver, FriendshipStatus.WAITING);
        when(userRepository.findById("receiver")).thenReturn(Optional.of(receiver));
        when(friendshipRepository.findBetween(requester, receiver)).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> friendshipService.unfriend(requester, "receiver"))
                .isInstanceOf(ExceptionResponse.class)
                .hasMessage("Friendship not found");
        verify(friendshipRepository, never()).delete(any());
    }

    @Test
    void profileShowsAnOutgoingFriendRequestAndOnlineState() {
        User viewer = user("viewer");
        User profileUser = user("profile");
        Friendship request = friendship(viewer, profileUser, FriendshipStatus.WAITING);
        when(friendshipRepository.findBetween(viewer, profileUser)).thenReturn(Optional.of(request));
        when(userPresenceService.isUserOnline("profile")).thenReturn(true);

        UserProfileResponse response = friendshipService.getUserProfile(viewer, profileUser);

        assertThat(response.getUser().getId()).isEqualTo("profile");
        assertThat(response.isOnline()).isTrue();
        assertThat(response.getFriendship()).isEqualTo(FriendshipRelationStatus.OUTGOING_REQUEST);
    }

    @Test
    void profileShowsAnIncomingFriendRequest() {
        User viewer = user("viewer");
        User profileUser = user("profile");
        Friendship request = friendship(profileUser, viewer, FriendshipStatus.WAITING);
        when(friendshipRepository.findBetween(viewer, profileUser)).thenReturn(Optional.of(request));

        UserProfileResponse response = friendshipService.getUserProfile(viewer, profileUser);

        assertThat(response.getFriendship()).isEqualTo(FriendshipRelationStatus.INCOMING_REQUEST);
    }

    @Test
    void profileShowsNoRelationshipWhenNoFriendshipExists() {
        User viewer = user("viewer");
        User profileUser = user("profile");
        when(friendshipRepository.findBetween(viewer, profileUser)).thenReturn(Optional.empty());

        UserProfileResponse response = friendshipService.getUserProfile(viewer, profileUser);

        assertThat(response.getFriendship()).isEqualTo(FriendshipRelationStatus.NONE);
    }

    private User user(String id) {
        User user = new User();
        user.setId(id);
        user.setUsername(id);
        return user;
    }

    private Friendship friendship(User requester, User receiver, FriendshipStatus status) {
        Friendship friendship = new Friendship();
        friendship.setRequester(requester);
        friendship.setReceiver(receiver);
        friendship.setStatus(status);
        return friendship;
    }
}
