package pro.damjan.belabackend.friendships;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import pro.damjan.belabackend.user.User;

import java.util.List;

public interface FriendshipRepository extends JpaRepository<Friendship, String> {
    @Query("""
        SELECT u
        FROM User u
        WHERE EXISTS (
            SELECT f
            FROM Friendship f
            WHERE f.status = pro.damjan.belabackend.friendships.FriendshipStatus.ACCEPTED
              AND (
                    (f.requester = :user AND f.receiver = u)
                 OR (f.receiver = :user AND f.requester = u)
              )
        )
        """)
    List<User> findFriendsFor(User user);
}
