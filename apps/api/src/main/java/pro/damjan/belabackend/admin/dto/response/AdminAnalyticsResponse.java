package pro.damjan.belabackend.admin.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Builder
@Getter
public class AdminAnalyticsResponse {
    private Instant generatedAt;
    private UserAnalyticsResponse users;
    private LiveActivityAnalyticsResponse activity;
}
