package pro.damjan.belabackend.lobby.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.index.Indexed;
import pro.damjan.belabackend.lobby.exception.LobbyFullException;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Arrays;
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

    @Getter @Setter
    private LobbyStatus status;

    @Getter @Setter
    private String gameId;

    public static final int MAX_PLAYERS = 4;

    // List of players in the lobby (exactly 4)

    private LobbyPlayer[] players = new LobbyPlayer[MAX_PLAYERS];

    public List<LobbyPlayer> getPlayers() {
        List<LobbyPlayer> playerList = new ArrayList<>();
        int len = players == null ? 0 : players.length;
        for (int i = 0; i < MAX_PLAYERS; i++) {
            if (i < len) {
                playerList.add(players[i]);
            } else {
                playerList.add(null);
            }
        }
        return playerList;
    }

    public void setPlayers(List<LobbyPlayer> playerList) {
        if (playerList.size() > MAX_PLAYERS) {
            throw new IllegalArgumentException("Cannot have more than " + MAX_PLAYERS + " players in the lobby.");
        }
        this.players = new LobbyPlayer[MAX_PLAYERS];
        for (int i = 0; i < playerList.size(); i++) {
            this.players[i] = playerList.get(i);
        }
    }

    @JsonInclude
    public List<LobbyPlayer> getNonNullPlayers() {
        if (players == null) return Collections.emptyList();
        List<LobbyPlayer> nonNullPlayers = new ArrayList<>();
        for (LobbyPlayer player : players) {
            if (player != null) {
                nonNullPlayers.add(player);
            }
        }
        return nonNullPlayers;
    }

    @JsonIgnore
    public int getLobbyPlayerCount() {
        int cnt = 0;
        int len = players == null ? 0 : Math.min(players.length, MAX_PLAYERS);
        for (int i = 0; i < len; i++) {
            if (players[i] != null) {
                cnt++;
            }
        }

        return cnt;
    }

    @JsonIgnore
    public boolean isPlayerInLobby(String userId) {
        int len = players == null ? 0 : Math.min(players.length, MAX_PLAYERS);
        for (int i = 0; i < len; i++) {
            if (players[i] != null && players[i].getUserId().equals(userId)) {
                return true;
            }
        }

        return false;
    }

    @JsonIgnore
    public LobbyPlayer getPlayerById(String userId) {
        int len = players == null ? 0 : Math.min(players.length, MAX_PLAYERS);
        for (int i = 0; i < len; i++) {
            if (players[i] != null && players[i].getUserId().equals(userId)) {
                return players[i];
            }
        }

        return null;
    }

    @JsonIgnore
    public LobbyPlayer getHost() {
        if (players == null) return null;
        for (LobbyPlayer player : players) {
            if (player != null && player.isHost()) {
                return player;
            }
        }
        return null;
    }

    @JsonIgnore
    public LobbyPlayer assignNewHost() {
        if (players == null) return null;
        for (LobbyPlayer player : players) {
            if (player != null) {
                player.setHost(true);
                return player;
            }
        }

        return null;
    }

    @JsonIgnore
    public boolean allPlayersReady() {
        if (players == null) return true;
        for (LobbyPlayer player : players) {
            if (player != null && player.getStatus() != LobbyPlayerStatus.READY) {
                return false;
            }
        }
        return true;
    }

    @JsonIgnore
    public boolean isFull() {
        return getLobbyPlayerCount() >= MAX_PLAYERS;
    }

    @JsonIgnore
    public void addPlayer(LobbyPlayer player) {
        if (this.players == null || this.players.length < MAX_PLAYERS) {
            LobbyPlayer[] newPlayers = new LobbyPlayer[MAX_PLAYERS];
            if (this.players != null) {
                System.arraycopy(this.players, 0, newPlayers, 0, this.players.length);
            }
            this.players = newPlayers;
        }
        for (int i = 0; i < this.players.length; i++) {
            if (this.players[i] == null) {
                this.players[i] = player;
                return;
            }
        }

        // If the loop finishes without returning, the lobby is full.
        throw new LobbyFullException();
    }

    @JsonIgnore
    // Returns true if host changed, false otherwise
    public boolean removePlayer(String userId) {
        if (players == null) return false;
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
