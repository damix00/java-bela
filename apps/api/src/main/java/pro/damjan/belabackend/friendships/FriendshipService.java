package pro.damjan.belabackend.friendships;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.user.User;

@Service
@RequiredArgsConstructor
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;

    public void sendFriendRequest(User from, User to) {
        Friendship friendship = new Friendship();
        friendship.setRequester(from);
        friendship.setReceiver(to);
        friendship.setStatus(FriendshipStatus.WAITING);
    }

}
