package pro.damjan.belabackend.lobby.model;

import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.index.Indexed;
import pro.damjan.belabackend.lobby.exception.LobbyFullException;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@RedisHash("Lobby")
public class Lobby implements Serializable {
    @Id
    @Getter @Setter
    private String id;

    @Indexed
    @Getter @Setter
    private String inviteCode;

    public static final int MAX_PLAYERS = 4;

    // List of players in the lobby (exactly 4)
    @Getter @Setter
    private LobbyPlayer[] players = new LobbyPlayer[MAX_PLAYERS];

    public int getLobbyPlayerCount() {
        int cnt = 0;

        for (int i = 0; i < MAX_PLAYERS; i++) {
            if (players[i] != null) {
                cnt++;
            }
        }

        return cnt;
    }

    public boolean isPlayerInLobby(String userId) {
        for (int i = 0; i < MAX_PLAYERS; i++) {
            if (players[i] != null && players[i].getUserId().equals(userId)) {
                return true;
            }
        }

        return false;
    }

    public LobbyPlayer getPlayerById(String userId) {
        for (int i = 0; i < MAX_PLAYERS; i++) {
            if (players[i] != null && players[i].getUserId().equals(userId)) {
                return players[i];
            }
        }

        return null;
    }

    public LobbyPlayer getHost() {
        for (LobbyPlayer player : players) {
            if (player != null && player.isHost()) {
                return player;
            }
        }
        return null;
    }

    public LobbyPlayer assignNewHost() {
        for (LobbyPlayer player : players) {
            if (player != null) {
                player.setHost(true);
                return player;
            }
        }

        return null;
    }

    public boolean allPlayersReady() {
        for (LobbyPlayer player : players) {
            if (player != null && player.getStatus() != LobbyPlayerStatus.READY) {
                return false;
            }
        }
        return true;
    }

    public boolean isFull() {
        return getLobbyPlayerCount() >= MAX_PLAYERS;
    }

    public void addPlayer(LobbyPlayer player) {
        for (int i = 0; i < this.players.length; i++) {
            if (this.players[i] == null) {
                this.players[i] = player;
                return;
            }
        }

        // If the loop finishes without returning, the lobby is full.
        throw new LobbyFullException();
    }

    // Returns true if host changed, false otherwise
    public boolean removePlayer(String userId) {
        boolean removed = false;
        for (int i = 0; i < players.length; i++) {
            if (players[i] != null && players[i].getUserId().equals(userId)) {
                players[i] = null;
                removed = true;
                break;
            }
        }

        if (!removed) return false;

        // Logic: If the lobby isn't empty and the host is gone, assign a new one
        if (getLobbyPlayerCount() > 0 && getHost() == null) {
            assignNewHost();
            return true; // Host changed
        }

        return false; // Host did not change (or lobby is now empty)
    }

}
