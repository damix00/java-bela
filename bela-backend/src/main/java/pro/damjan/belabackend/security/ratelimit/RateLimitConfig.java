package pro.damjan.belabackend.security.ratelimit;

import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import java.time.Duration;

@Configuration
@RequiredArgsConstructor
public class RateLimitConfig {

    private final RedisConnectionFactory redisConnectionFactory;

    @Bean
    public ProxyManager<String> proxyManager() {
        RedisClient redisClient = (RedisClient) ((LettuceConnectionFactory) redisConnectionFactory).getNativeClient();

        return LettuceBasedProxyManager.builderFor(redisClient.connect(RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE)))
                .withExpirationStrategy(ExpirationAfterWriteStrategy.basedOnTimeForRefillingBucketUpToMax(Duration.ofSeconds(10)))
                .build();
    }
}