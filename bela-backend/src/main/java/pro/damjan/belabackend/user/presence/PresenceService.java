package pro.damjan.belabackend.user.presence;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.user.presence.model.UserPresence;

import java.time.LocalDateTime;

/**
 * Service for managing user presence in the application.
 * It uses Redis to store and retrieve user presence information.
 * IMPORTANT: We will not delete the presence when the user goes offline, because
 * the user may still be in-game. We will just update the presence with the last seen time and set the online status to false.
*/
@Service
public class PresenceService {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String PRESENCE_KEY_PREFIX = "presence:";

    public PresenceService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public UserPresence getUserPresence(String userId) {
        return (UserPresence) redisTemplate.opsForValue().get(PRESENCE_KEY_PREFIX + userId);
    }

    public void setUserPresence(String userId, UserPresence presence) {
        redisTemplate.opsForValue().set(PRESENCE_KEY_PREFIX + userId, presence, UserPresence.ttl);
    }

    public boolean isUserOnline(String userId) {
        UserPresence presence = getUserPresence(userId);
        return presence != null && presence.isOnline();
    }

    public void presenceKeepAlive(String userId) {
        UserPresence presence = getUserPresence(userId);

        if (presence != null) {
            redisTemplate.opsForValue().set(PRESENCE_KEY_PREFIX + userId, presence, UserPresence.ttl);
        } else {
            // Presence doesn't exist, we will create a new one with default values.
            setUserPresence(userId, new UserPresence(LocalDateTime.now(), null, null));
        }
    }
}
