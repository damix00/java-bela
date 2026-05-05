package pro.damjan.belabackend.game.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Id;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.redis.core.RedisHash;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.player.Team;
import pro.damjan.belabackend.game.model.round.BeloteRound;
import pro.damjan.belabackend.game.model.round.RoundStatus;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@RedisHash(value = "BeloteGame", timeToLive = 3600)
@Builder
@Getter
public class BeloteGame implements Serializable {
    @Id
    private String id;

    private final Team team1;
    private final Team team2;

    private final int maxPoints;

    @Setter
    private GameStatus status;

    @Setter
    @Builder.Default
    private int currentRoundNumber = -1; // 0-based index for rounds, -1 means no rounds started yet.

    @Builder.Default
    private List<BeloteRound> rounds = new ArrayList<>();
    private BeloteRound currentRound;

    private List<BeloteRound> roundsOrEmpty() {
        if (rounds == null) {
            rounds = new ArrayList<>();
        }

        return rounds;
    }

    public GamePlayer getPlayer(int index)
    {
        if (index < 0 || index > 3) {
            throw new IllegalArgumentException("Player index must be between 0 and 3");
        }

        // 0,2 - team1, 1,3 - team2
        if (index % 2 == 0) {
            return team1.getPlayers().get(index / 2);
        }

        return team2.getPlayers().get(index / 2);
    }

    public Team getTeam(int index) {
        if (index < 0 || index > 1) {
            throw new IllegalArgumentException("Team index must be 0 or 1");
        }

        return index == 0 ? team1 : team2;
    }

    public void finishCurrentRoundScoring() {
        if (currentRound == null || currentRound.getRoundStatus() != RoundStatus.FINISHED) {
            throw new IllegalStateException("Current round is not finished");
        }

        team1.addScore(currentRound.getTeam1RoundScore());
        team2.addScore(currentRound.getTeam2RoundScore());
    }

    @JsonIgnore
    public List<GamePlayer> getPlayers() {
        return List.of(
                team1.getPlayers().get(0),
                team2.getPlayers().get(0),
                team1.getPlayers().get(1),
                team2.getPlayers().get(1)
        );
    }

    public BeloteRound createNewRound() {
        BeloteRound curr = getCurrentRound();
        int startingPlayerIndex = curr == null ? 0 : (curr.getStartingPlayerIndex() + 1) % 4;

        BeloteRound round = new BeloteRound(++currentRoundNumber, startingPlayerIndex, RoundStatus.CHOOSING_TRUMP);
        roundsOrEmpty().add(round);
        currentRound = round;
        return round;
    }

    public void startGame() {
        status = GameStatus.IN_PROGRESS;
    }
}
