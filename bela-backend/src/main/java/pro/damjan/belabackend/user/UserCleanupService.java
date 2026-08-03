package pro.damjan.belabackend.user;

import jakarta.transaction.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.user.auth.AuthProvider;
import pro.damjan.belabackend.user.auth.refresh.RefreshTokenRepository;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class UserCleanupService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    public UserCleanupService(UserRepository userRepository, RefreshTokenRepository refreshTokenRepository) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Scheduled(fixedRate = 60 * 60 * 1000) // Run once per hour
    @Transactional
    public void cleanupAnonymousUsers() {
        // Clean up anonymous users that are older than 24 hours
        Instant cutoffTime = Instant.now().minus(Duration.ofHours(24));

        // Their refresh tokens go first, otherwise orphan rows accumulate forever
        List<String> doomedUserIds =
                userRepository.findIdsByAuthProviderAndCreatedAtBefore(AuthProvider.ANONYMOUS, cutoffTime);
        if (!doomedUserIds.isEmpty()) {
            refreshTokenRepository.deleteByUserIdIn(doomedUserIds);
        }

        userRepository.deleteUsersByAuthProviderAndCreatedAtBefore(AuthProvider.ANONYMOUS, cutoffTime);
    }
}
