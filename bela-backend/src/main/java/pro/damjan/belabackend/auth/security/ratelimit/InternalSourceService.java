package pro.damjan.belabackend.auth.security.ratelimit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class InternalSourceService {

    public static final String INTERNAL_SOURCE_HEADER = "X-Internal-Source-Token";

    @Value("${app.internal-api-key}")
    private String internalApiKey;

    public boolean isInternalSource(String apiKey) {
        return internalApiKey.equals(apiKey);
    }
}
