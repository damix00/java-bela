package pro.damjan.belabackend.user.presence;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;

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
        Object object = redisTemplate.opsForValue().get(PRESENCE_KEY_PREFIX + userId);

        // Casting doesn't work here, we have to use object mapper
        ObjectMapper objectMapper = new ObjectMapper();

        return objectMapper.convertValue(object, UserPresence.class);
    }

    public void setUserPresence(String userId, UserPresence presence) {
        presence.setLastPing(Instant.now()); // Update last ping time whenever we set the presence
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
            setUserPresence(userId, new UserPresence(Instant.now(), null, null));

            // TODO: Send a socket event to friends about the presence update
        }
    }

    public void setUserLobby(String userId, String lobbyId) {
        UserPresence presence = getUserPresence(userId);

        if (presence == null) {
            presence = new UserPresence(Instant.now(), lobbyId, null);
        } else {
            presence.setLobbyId(lobbyId);
        }

        setUserPresence(userId, presence);
    }

    public void setUserGame(String userId, String gameId) {
        UserPresence presence = getUserPresence(userId);

        if (presence == null) {
            throw new IllegalStateException("User presence not found for userId: " + userId);
        } else {
            presence.setGameId(gameId);
        }

        setUserPresence(userId, presence);
    }
}
