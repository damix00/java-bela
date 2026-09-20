package pro.damjan.belabackend.user.presence;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import pro.damjan.belabackend.user.presence.session.SessionService;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserPresenceServiceTest {

    private RedisTemplate<String, Object> redisTemplate;
    private ValueOperations<String, Object> valueOperations;
    private UserPresenceService userPresenceService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        redisTemplate = mock(RedisTemplate.class);
        valueOperations = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        userPresenceService = new UserPresenceService(redisTemplate, mock(SessionService.class));
    }

    @Test
    void checksMultipleUsersWithOneRedisRequest() {
        UserPresence onlinePresence = presenceAt(Instant.now());
        UserPresence offlinePresence = presenceAt(Instant.now().minusSeconds(60));
        List<String> presenceKeys = List.of("presence:online", "presence:missing", "presence:offline");
        when(valueOperations.multiGet(presenceKeys))
                .thenReturn(Arrays.asList(onlinePresence, null, offlinePresence));

        Map<String, Boolean> statuses = userPresenceService.getUsersOnlineStatus(
                List.of("online", "missing", "offline")
        );

        assertThat(statuses).containsExactly(
                Map.entry("online", true),
                Map.entry("missing", false),
                Map.entry("offline", false)
        );
        verify(valueOperations).multiGet(presenceKeys);
    }

    @Test
    void checksEachUserOnlyOnceWhilePreservingInputOrder() {
        List<String> presenceKeys = List.of("presence:second", "presence:first");
        when(valueOperations.multiGet(presenceKeys))
                .thenReturn(List.of(presenceAt(Instant.now()), presenceAt(Instant.now())));

        Map<String, Boolean> statuses = userPresenceService.getUsersOnlineStatus(
                List.of("second", "first", "second")
        );

        assertThat(statuses).containsExactly(
                Map.entry("second", true),
                Map.entry("first", true)
        );
        verify(valueOperations).multiGet(presenceKeys);
    }

    private UserPresence presenceAt(Instant lastPing) {
        return new UserPresence(lastPing, null, null);
    }
}
