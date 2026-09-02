package pro.damjan.belabackend.admin;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class AdminAnalyticsConfig {

    @Bean
    public Clock adminAnalyticsClock() {
        return Clock.systemUTC();
    }
}
