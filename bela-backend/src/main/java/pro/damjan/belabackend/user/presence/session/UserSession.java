package pro.damjan.belabackend.user.presence.session;

import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;
import org.springframework.data.redis.core.index.Indexed;

import java.io.Serializable;

@RedisHash("UserSession")
@Getter @Setter
public class UserSession implements Serializable {

    @Id
    private String id;

    @Indexed
    private String userId;

    private SessionMetadata metadata;

    // Whether this session is the current session for the joined game
    // This is because the user can only join one game on one device, but they can have multiple sessions (e.g. on mobile and desktop)
    // So we prevent the user from joining multiple games at the same time
    @Indexed
    private boolean active;

    @TimeToLive
    private long ttl = 60; // 60 seconds

}
