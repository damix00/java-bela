package pro.damjan.belabackend.user;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.user.auth.AuthProvider;

import java.time.Duration;
import java.time.Instant;

@Service
public class UserCleanupService {

    private final UserRepository userRepository;

    public UserCleanupService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Scheduled(fixedRate = 60 * 60 * 1000) // Run once per hour
    public void cleanupAnonymousUsers() {
        // Clean up anonymous users that are older than 24 hours
        Instant cutoffTime = Instant.now().minus(Duration.ofHours(24));
        userRepository.deleteUsersByAuthProviderAndCreatedAtBefore(AuthProvider.ANONYMOUS, cutoffTime);
    }
}
