package pro.damjan.belabackend.friendships;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import pro.damjan.belabackend.user.User;

import java.time.Instant;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(
    name = "friendships"
)
@Getter
@Setter
public class Friendship {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private FriendshipStatus status = FriendshipStatus.WAITING;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

}
