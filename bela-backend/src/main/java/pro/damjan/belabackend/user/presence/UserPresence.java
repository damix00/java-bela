package pro.damjan.belabackend.user.presence;

import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.time.Duration;
import java.time.Instant;

@Getter @Setter
public class UserPresence implements Serializable {
    private Instant lastPing;
    private String lobbyId;
    private String gameId;

    private PresenceStatus status;

    public UserPresence(
            Instant lastPing,
            String lobbyId,
            String gameId
    ) {
        this.lastPing = lastPing;
        this.lobbyId = lobbyId;
        this.gameId = gameId;
    }

    public static final Duration ttl = Duration.ofSeconds(30);

    public boolean isOnline() {
        // at least 30 seconds ago
        return lastPing.isAfter(Instant.now().minusSeconds(30));
    }

    public PresenceStatus getStatus() {
        if (isOnline()) {
            if (lobbyId != null) {
                return PresenceStatus.IN_LOBBY;
            } else if (gameId != null) {
                return PresenceStatus.IN_GAME;
            } else {
                return PresenceStatus.ONLINE;
            }
        } else {
            return PresenceStatus.OFFLINE;
        }
    }
}