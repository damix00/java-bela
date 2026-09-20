package pro.damjan.belabackend.friendships;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserRepository;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class FriendshipRepositoryTest {

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void findsAcceptedFriendshipsInEitherDirection() {
        User firstUser = saveUser("FriendQueryFirst");
        User secondUser = saveUser("FriendQuerySecond");
        User waitingUser = saveUser("FriendQueryWaiting");

        saveFriendship(firstUser, secondUser, FriendshipStatus.ACCEPTED);
        saveFriendship(waitingUser, firstUser, FriendshipStatus.WAITING);

        assertThat(friendshipRepository.findFriendsFor(firstUser)).containsExactly(secondUser);
        assertThat(friendshipRepository.findFriendsFor(secondUser)).containsExactly(firstUser);
        assertThat(friendshipRepository.areFriends(firstUser, secondUser)).isTrue();
        assertThat(friendshipRepository.areFriends(secondUser, firstUser)).isTrue();
        assertThat(friendshipRepository.areFriends(firstUser, waitingUser)).isFalse();
    }

    private User saveUser(String username) {
        User user = new User();
        user.setUsername(username);
        return userRepository.saveAndFlush(user);
    }

    private void saveFriendship(User requester, User receiver, FriendshipStatus status) {
        Friendship friendship = new Friendship();
        friendship.setRequester(requester);
        friendship.setReceiver(receiver);
        friendship.setStatus(status);
        friendshipRepository.saveAndFlush(friendship);
    }
}
