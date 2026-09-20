package pro.damjan.belabackend.friendships;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import pro.damjan.belabackend.user.User;

import java.util.List;

public interface FriendshipRepository extends JpaRepository<Friendship, String> {
    @Query("""
        SELECT f.receiver
        FROM Friendship f
        WHERE f.status = pro.damjan.belabackend.friendships.FriendshipStatus.ACCEPTED
          AND f.requester = :user
        UNION
        SELECT f.requester
        FROM Friendship f
        WHERE f.status = pro.damjan.belabackend.friendships.FriendshipStatus.ACCEPTED
          AND f.receiver = :user
        """)
    List<User> findFriendsFor(User user);

    @Query("""
        SELECT EXISTS (
            SELECT 1
            FROM Friendship f
            WHERE f.status = pro.damjan.belabackend.friendships.FriendshipStatus.ACCEPTED
              AND (
                    (f.requester = :firstUser AND f.receiver = :secondUser)
                 OR (f.requester = :secondUser AND f.receiver = :firstUser)
              )
        )
        """)
    boolean areFriends(User firstUser, User secondUser);
}
