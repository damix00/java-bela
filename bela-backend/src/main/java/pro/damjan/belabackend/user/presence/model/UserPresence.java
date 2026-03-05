package pro.damjan.belabackend.user.presence.model;

import lombok.Getter;
import lombok.Setter;

import java.io.Serial;
import java.io.Serializable;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Objects;

@Getter @Setter
public class UserPresence implements Serializable {
    private LocalDateTime lastOnline;
    private String lobbyId;
    private String gameId;

    public UserPresence(
            LocalDateTime lastOnline,
            String lobbyId,
            String gameId
    ) {
        this.lastOnline = lastOnline;
        this.lobbyId = lobbyId;
        this.gameId = gameId;
    }

    public static final Duration ttl = Duration.ofMinutes(30);

    public boolean isOnline() {
        // at least 30 seconds ago
        return lastOnline.isAfter(LocalDateTime.now().minusSeconds(30));
    }
}