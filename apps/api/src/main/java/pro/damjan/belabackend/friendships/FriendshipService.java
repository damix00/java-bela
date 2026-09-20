package pro.damjan.belabackend.friendships;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.dto.response.PublicUserResponse;
import pro.damjan.belabackend.user.dto.response.UserProfileResponse;
import pro.damjan.belabackend.user.presence.UserPresenceService;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserPresenceService userPresenceService;

    public Friendship sendFriendRequest(User from, User to) {
        Friendship friendship = new Friendship();
        friendship.setRequester(from);
        friendship.setReceiver(to);
        friendship.setStatus(FriendshipStatus.WAITING);

        return friendshipRepository.save(friendship);
    }

    public boolean areFriends(User a, User b) {
        return friendshipRepository.areFriends(a, b);
    }

    public List<UserProfileResponse> getFriends(User user) {
        List<User> friends = friendshipRepository.findFriendsFor(user);
        var onlineStatus = userPresenceService.getUsersOnlineStatus(friends);

        List<UserProfileResponse> res = new ArrayList<>();

        for (User friend : friends) {
            UserProfileResponse profile = UserProfileResponse.builder()
                .online(onlineStatus.get(friend.getId()))
                .friendship(FriendshipStatus.ACCEPTED)
                .user(PublicUserResponse.fromUser(friend))
                .build();

            res.add(profile);
        }

        return res;
    }

}
