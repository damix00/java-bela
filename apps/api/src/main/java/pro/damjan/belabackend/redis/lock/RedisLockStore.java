package pro.damjan.belabackend.redis.lock;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;

/**
 * Locks held in Redis, which every instance can see.
 *
 * Taking one is {@code SET key token NX PX lease} — set only if absent, and expire on its own so a
 * process that dies mid-section releases the key rather than wedging it. Releasing goes through a
 * script instead of a plain {@code DEL} because the check and the delete have to be one step: an
 * instance whose lease expired mid-section must not delete a lock another instance has since
 * taken, and between a {@code GET} and a {@code DEL} that is exactly what could happen.
 */
@Component
@RequiredArgsConstructor
public class RedisLockStore implements LockStore {

    private final StringRedisTemplate redisTemplate;
    private final RedisScript<Long> releaseLockScript;

    @Override
    public boolean tryAcquire(String key, String token, Duration lease) {
        return Boolean.TRUE.equals(
                redisTemplate.opsForValue().setIfAbsent(key, token, lease));
    }

    @Override
    public void release(String key, String token) {
        redisTemplate.execute(releaseLockScript, List.of(key), token);
    }
}
