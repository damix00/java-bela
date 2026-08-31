package pro.damjan.belabackend.user.presence.session;

import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;
import org.springframework.data.redis.core.index.Indexed;

import java.io.Serializable;
import java.time.Instant;

@RedisHash(value = "UserSession", timeToLive = 30) // 30 seconds TTL for each session
@Getter @Setter
public class UserSession implements Serializable {

    @Id
    private String id;

    @Indexed
    private String userId;

    private SessionMetadata metadata;

    /**
     * When the handshake that minted this session happened.
     *
     * The takeover rule is "the newest connection wins", and
     * {@code findByUserId} hands sessions back in no particular order, so
     * recency has to be written down rather than inferred.
     */
    private Instant createdAt;

    /**
     * Whether this is the connection currently holding the player's seat.
     *
     * A player may have several sessions open at once (a phone and a desktop),
     * but only one of them plays: gameplay is published to the active session
     * alone. Opening a new one takes the seat from whichever session held it —
     * see {@code SessionTakeoverService} — and the superseded connection is
     * told so rather than left showing a table it can no longer act on.
     */
    private boolean active;

    @TimeToLive
    private long ttl = 30; // Default TTL of 30 seconds
}
