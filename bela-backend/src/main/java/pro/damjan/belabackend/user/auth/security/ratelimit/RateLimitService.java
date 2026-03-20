package pro.damjan.belabackend.user.auth.security.ratelimit;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RateLimitService {

    private final ProxyManager<String> proxyManager;

    public ConsumptionProbe consume(String key, BucketConfiguration config) {
        Bucket bucket = proxyManager
                .builder()
                .build("rate_limit:" + key, () -> config);

        return bucket.tryConsumeAndReturnRemaining(1);
    }

    public void restore(String key, BucketConfiguration config) {
        Bucket bucket = proxyManager.builder().build("rate_limit:" + key, () -> config);
        bucket.addTokens(1);
    }
}
