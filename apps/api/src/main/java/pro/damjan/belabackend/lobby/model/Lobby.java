package pro.damjan.belabackend.lobby.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.index.Indexed;
import pro.damjan.belabackend.game.model.config.GameConfiguration;
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

    @Getter @Setter
    private GameConfiguration gameConfiguration;

    @Getter @Setter
    private boolean joinable = true;

    public static final int MAX_PLAYERS = 4;

    /**
     * Order in which {@link #addPlayer} claims free seats.
     *
     * Partners sit opposite each other — seats 0 and 2 are one team, 1 and 3 the other, as
     * {@code Team.pairFrom} pairs them — so the second player to arrive is seated at 2 rather
     * than 1. Someone who invites a friend expects to play *with* them; filling the seats in
     * index order made the default the opposite of that, and only a seat swap undid it.
     * Playing against a friend is still available, by swapping.
     */
    private static final int[] SEAT_FILL_ORDER = { 0, 2, 1, 3 };

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

    // --- Mutation methods ---

    @JsonIgnore
    public void addPlayer(LobbyPlayer player) {
        if (isFull()) throw new LobbyFullException();
        for (int seat : SEAT_FILL_ORDER) {
            if (!playerSeats.containsKey(seat)) {
                player.setSeat(seat);
                playerSeats.put(seat, player);
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

    /**
     * Puts the lobby back into a rematch-ready state after its game finished.
     *
     * Nulling the game id is what re-opens {@code onPlayerReady} — it refuses to run while one is
     * set. Bots are dropped so the seats they filled are open again, and the humans have to opt back
     * in rather than being carried into another game by a ready flag they set for the last one.
     * The game configuration is deliberately kept.
     */
    @JsonIgnore
    public void resetAfterGame() {
        status = LobbyStatus.IN_LOBBY;
        gameId = null;
        joinable = true;

        playerSeats.values().removeIf(LobbyPlayer::isBot);
        playerSeats.values().forEach(player -> player.setStatus(LobbyPlayerStatus.NOT_READY));

        if (getHost().isEmpty()) assignNewHost();
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
