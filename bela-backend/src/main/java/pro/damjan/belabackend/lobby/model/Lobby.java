package pro.damjan.belabackend.lobby.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.index.Indexed;
import pro.damjan.belabackend.lobby.exception.LobbyFullException;
import pro.damjan.belabackend.lobby.exception.PlayerNotInLobbyException;

import java.io.Serializable;
import java.util.*;

@RedisHash(value = "Lobby", timeToLive = 3600) // 1 hour TTL
public class Lobby implements Serializable {
    @Id
    @Getter @Setter
    private String id;

    @Indexed
    @Getter @Setter
    private String inviteCode;

    @Getter @Setter
    private LobbyStatus status = LobbyStatus.IN_LOBBY;

    @Getter @Setter
    private String gameId;

    public static final int MAX_PLAYERS = 4;

    @Getter @Setter
    private Map<Integer, LobbyPlayer> playerSeats = new HashMap<>();

    @JsonIgnore
    public List<LobbyPlayer> getPlayersAsList() {
        List<LobbyPlayer> list = new ArrayList<>(MAX_PLAYERS);
        for (int i = 0; i < MAX_PLAYERS; i++) {
            list.add(playerSeats.get(i)); // null if seat empty
        }
        return list;
    }

    @JsonIgnore
    public Collection<LobbyPlayer> getActivePlayers() {
        return playerSeats.values();
    }

    // --- Query methods ---

    @JsonIgnore
    public int getPlayerCount() {
        return playerSeats.size();
    }

    @JsonIgnore
    public boolean isFull() {
        return playerSeats.size() >= MAX_PLAYERS;
    }

    @JsonIgnore
    public boolean isPlayerInLobby(String userId) {
        return playerSeats.values().stream().anyMatch(p -> p.getUserId().equals(userId));
    }

    @JsonIgnore
    public Optional<LobbyPlayer> findPlayerById(String userId) {
        return playerSeats.values().stream().filter(p -> p.getUserId().equals(userId)).findFirst();
    }

    @JsonIgnore
    public Optional<LobbyPlayer> getHost() {
        return playerSeats.values().stream().filter(LobbyPlayer::isHost).findFirst();
    }

    @JsonIgnore
    public boolean allPlayersReady() {
        return playerSeats.values().stream().allMatch(p -> p.getStatus() == LobbyPlayerStatus.READY);
    }

    @JsonIgnore
    public int getTeam(int seat) {
        return seat < 2 ? 0 : 1; // 0 = team A (seats 0,1), 1 = team B (seats 2,3)
    }

    @JsonIgnore
    public int getTeam(LobbyPlayer player) {
        return getTeam(player.getSeat());
    }

    @JsonIgnore
    public List<LobbyPlayer> getTeamPlayers(int team) {
        return playerSeats.entrySet().stream()
                .filter(e -> getTeam(e.getKey()) == team)
                .map(Map.Entry::getValue)
                .toList();
    }

    // --- Mutation methods ---

    @JsonIgnore
    public void addPlayer(LobbyPlayer player) {
        if (isFull()) throw new LobbyFullException();
        for (int i = 0; i < MAX_PLAYERS; i++) {
            if (!playerSeats.containsKey(i)) {
                player.setSeat(i);
                playerSeats.put(i, player);
                return;
            }
        }
        throw new LobbyFullException();
    }

    @JsonIgnore
    public void swapSeats(String userId, int targetSeat) {
        if (targetSeat < 0 || targetSeat >= MAX_PLAYERS) {
            throw new IllegalArgumentException("Invalid seat: " + targetSeat);
        }

        LobbyPlayer moving = findPlayerById(userId)
                .orElseThrow(PlayerNotInLobbyException::new);

        int currentSeat = moving.getSeat();
        if (currentSeat == targetSeat) return;

        LobbyPlayer occupant = playerSeats.get(targetSeat); // null if empty

        playerSeats.remove(currentSeat);
        moving.setSeat(targetSeat);
        playerSeats.put(targetSeat, moving);

        if (occupant != null) {
            occupant.setSeat(currentSeat);
            playerSeats.put(currentSeat, occupant);
        }
    }

    @JsonIgnore
    public RemoveResult removePlayer(String userId) {
        Optional<LobbyPlayer> found = findPlayerById(userId);
        if (found.isEmpty()) return RemoveResult.NOT_FOUND;

        playerSeats.remove(found.get().getSeat());

        if (!playerSeats.isEmpty() && getHost().isEmpty()) {
            playerSeats.values().iterator().next().setHost(true);
            return RemoveResult.REMOVED_AND_HOST_CHANGED;
        }

        return RemoveResult.REMOVED;
    }

    @JsonIgnore
    public Optional<LobbyPlayer> assignNewHost() {
        Optional<LobbyPlayer> next = playerSeats.values().stream().findFirst();
        next.ifPresent(p -> p.setHost(true));
        return next;
    }

    public enum RemoveResult {
        NOT_FOUND, REMOVED, REMOVED_AND_HOST_CHANGED
    }

}
