package pro.damjan.belabackend.user.presence.model;

import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.time.Duration;
import java.time.LocalDateTime;

@Getter @Setter
public class UserPresence implements Serializable {
    private LocalDateTime lastPing;
    private String lobbyId;
    private String gameId;

    public UserPresence(
            LocalDateTime lastPing,
            String lobbyId,
            String gameId
    ) {
        this.lastPing = lastPing;
        this.lobbyId = lobbyId;
        this.gameId = gameId;
    }

    public static final Duration ttl = Duration.ofMinutes(30);

    public boolean isOnline() {
        // at least 30 seconds ago
        return lastPing.isAfter(LocalDateTime.now().minusSeconds(30));
    }
}