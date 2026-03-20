package pro.damjan.belabackend.user.presence;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PresenceServiceTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    private PresenceService presenceService;

    private static final String USER_ID = "user-123";
    private static final String PRESENCE_KEY = "presence:" + USER_ID;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        presenceService = new PresenceService(redisTemplate);
    }

    @Test
    void getUserPresence_returnsPresence_whenExists() {
        UserPresence expected = new UserPresence(Instant.now(), "lobby-1", "game-1");
        when(valueOperations.get(PRESENCE_KEY)).thenReturn(expected);

        UserPresence result = presenceService.getUserPresence(USER_ID);

        assertEquals(expected, result);
        verify(valueOperations).get(PRESENCE_KEY);
    }

    @Test
    void getUserPresence_returnsNull_whenNotExists() {
        when(valueOperations.get(PRESENCE_KEY)).thenReturn(null);

        UserPresence result = presenceService.getUserPresence(USER_ID);

        assertNull(result);
    }

    @Test
    void setUserPresence_storesWithTtl() {
        UserPresence presence = new UserPresence(Instant.now(), "lobby-1", null);

        presenceService.setUserPresence(USER_ID, presence);

        verify(valueOperations).set(PRESENCE_KEY, presence, UserPresence.ttl);
    }

    @Test
    void isUserOnline_returnsTrue_whenPresenceExistsAndOnline() {
        UserPresence presence = new UserPresence(Instant.now(), null, null);
        when(valueOperations.get(PRESENCE_KEY)).thenReturn(presence);

        assertTrue(presenceService.isUserOnline(USER_ID));
    }

    @Test
    void isUserOnline_returnsFalse_whenPresenceExistsButOffline() {
        // lastOnline more than 30 seconds ago → offline
        UserPresence presence = new UserPresence(Instant.now().minusSeconds(5 * 60), null, null);
        when(valueOperations.get(PRESENCE_KEY)).thenReturn(presence);

        assertFalse(presenceService.isUserOnline(USER_ID));
    }

    @Test
    void isUserOnline_returnsFalse_whenPresenceNotExists() {
        when(valueOperations.get(PRESENCE_KEY)).thenReturn(null);

        assertFalse(presenceService.isUserOnline(USER_ID));
    }

    @Test
    void presenceKeepAlive_refreshesTtl_whenPresenceExists() {
        UserPresence existing = new UserPresence(Instant.now(), "lobby-1", "game-1");
        when(valueOperations.get(PRESENCE_KEY)).thenReturn(existing);

        presenceService.presenceKeepAlive(USER_ID);

        verify(valueOperations).set(PRESENCE_KEY, existing, UserPresence.ttl);
    }

    @Test
    void presenceKeepAlive_createsNewPresence_whenPresenceNotExists() {
        when(valueOperations.get(PRESENCE_KEY)).thenReturn(null);

        presenceService.presenceKeepAlive(USER_ID);

        verify(valueOperations).set(eq(PRESENCE_KEY), argThat(arg -> {
            UserPresence p = (UserPresence) arg;
            return p.getLobbyId() == null && p.getGameId() == null && p.getLastPing() != null;
        }), eq(UserPresence.ttl));
    }
}

