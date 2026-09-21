package pro.damjan.belabackend.friendships;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pro.damjan.belabackend.exception.ExceptionResponse;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserRepository;
import pro.damjan.belabackend.user.dto.response.PublicUserResponse;
import pro.damjan.belabackend.user.dto.response.UserProfileResponse;
import pro.damjan.belabackend.user.presence.UserPresenceService;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final UserPresenceService userPresenceService;

    @Transactional
    public void sendFriendRequest(User requester, String receiverId) {
        User receiver = requireUser(receiverId);

        if (requester.getId().equals(receiver.getId())) {
            throw new ExceptionResponse(HttpStatus.BAD_REQUEST, "You cannot send a friend request to yourself");
        }

        if (friendshipRepository.findBetween(requester, receiver).isPresent()) {
            throw new ExceptionResponse(HttpStatus.CONFLICT, "A friendship or friend request already exists");
        }

        Friendship friendship = new Friendship();
        friendship.setRequester(requester);
        friendship.setReceiver(receiver);
        friendship.setStatus(FriendshipStatus.WAITING);

        try {
            friendshipRepository.saveAndFlush(friendship);
        } catch (DataIntegrityViolationException exception) {
            // The database's unordered-pair unique index closes the race between
            // two simultaneous requests in opposite directions.
            throw new ExceptionResponse(HttpStatus.CONFLICT, "A friendship or friend request already exists");
        }
    }

    @Transactional
    public void respondToFriendRequest(User receiver, String requesterId, boolean accepted) {
        User requester = requireUser(requesterId);
        Friendship request = friendshipRepository
                .findByRequesterAndReceiverAndStatus(requester, receiver, FriendshipStatus.WAITING)
                .orElseThrow(() -> new ExceptionResponse(HttpStatus.NOT_FOUND, "Friend request not found"));

        if (accepted) {
            request.setStatus(FriendshipStatus.ACCEPTED);
        } else {
            friendshipRepository.delete(request);
        }
    }

    @Transactional
    public void unfriend(User user, String friendId) {
        User friend = requireUser(friendId);
        Friendship friendship = friendshipRepository.findBetween(user, friend)
                .filter(candidate -> candidate.getStatus() == FriendshipStatus.ACCEPTED)
                .orElseThrow(() -> new ExceptionResponse(HttpStatus.NOT_FOUND, "Friendship not found"));

        friendshipRepository.delete(friendship);
    }

    @Transactional(readOnly = true)
    public boolean areFriends(User a, User b) {
        return friendshipRepository.areFriends(a, b);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(User viewer, User profileUser) {
        return UserProfileResponse.builder()
                .user(PublicUserResponse.fromUser(profileUser))
                .online(userPresenceService.isUserOnline(profileUser.getId()))
                .friendship(getRelationshipStatus(viewer, profileUser))
                .build();
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getFriends(User user) {
        List<User> friends = friendshipRepository.findFriendsFor(user);
        var onlineStatus = userPresenceService.getUsersOnlineStatus(friends);

        List<UserProfileResponse> res = new ArrayList<>();

        for (User friend : friends) {
            UserProfileResponse profile = UserProfileResponse.builder()
                .online(onlineStatus.get(friend.getId()))
                .friendship(FriendshipRelationStatus.FRIENDS)
                .user(PublicUserResponse.fromUser(friend))
                .build();

            res.add(profile);
        }

        return res;
    }

    private FriendshipRelationStatus getRelationshipStatus(User viewer, User profileUser) {
        if (viewer.getId().equals(profileUser.getId())) {
            return FriendshipRelationStatus.NONE;
        }

        return friendshipRepository.findBetween(viewer, profileUser)
                .map(friendship -> {
                    if (friendship.getStatus() == FriendshipStatus.ACCEPTED) {
                        return FriendshipRelationStatus.FRIENDS;
                    }

                    return friendship.getRequester().getId().equals(viewer.getId())
                            ? FriendshipRelationStatus.OUTGOING_REQUEST
                            : FriendshipRelationStatus.INCOMING_REQUEST;
                })
                .orElse(FriendshipRelationStatus.NONE);
    }

    private User requireUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ExceptionResponse(HttpStatus.NOT_FOUND, "User not found"));
    }

}
