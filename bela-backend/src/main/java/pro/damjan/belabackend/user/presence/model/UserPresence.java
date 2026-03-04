package pro.damjan.belabackend.user.presence.model;

import java.io.Serializable;
import java.time.Duration;
import java.time.LocalDateTime;

public record UserPresence(
        LocalDateTime lastOnline,
        String lobbyId,
        String gameId
) implements Serializable {
    public boolean isOnline() {
        // at least 30 seconds ago
        return lastOnline.isAfter(LocalDateTime.now().minusSeconds(30));
    }

    public static Duration ttl = Duration.ofMinutes(30);
}