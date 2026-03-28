package pro.damjan.belabackend.user.presence;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.redis.core.TimeToLive;

import java.io.Serializable;
import java.time.Duration;
import java.time.Instant;

@Getter @Setter
public class UserPresence implements Serializable {
    private Instant lastPing;
    private String lobbyId;
    private String gameId;

    public UserPresence(
            Instant lastPing,
            String lobbyId,
            String gameId
    ) {
        this.lastPing = lastPing;
        this.lobbyId = lobbyId;
        this.gameId = gameId;
    }

    public static final Duration ONLINE_TTL = Duration.ofSeconds(15);
    public static final Duration STALE_TTL = Duration.ofSeconds(30);

    @TimeToLive
    private long ttl = STALE_TTL.getSeconds();

    public boolean isOnline() {
        return lastPing.isAfter(Instant.now().minus(ONLINE_TTL));
    }

    public boolean isStale() {
        // truly gone — safe to clean up lobby/game references
        return lastPing.isBefore(Instant.now().minus(STALE_TTL));
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