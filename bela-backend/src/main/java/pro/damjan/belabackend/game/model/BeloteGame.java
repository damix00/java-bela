package pro.damjan.belabackend.game.model;

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

    @SuppressWarnings("UnusedAssignment")
    @Setter
    private int currentRoundNumber = -1; // 0-based index for rounds, -1 means no rounds started yet.

    private List<BeloteRound> rounds;
    private BeloteRound currentRound;

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

    public List<GamePlayer> getPlayers() {
        return List.of(
                team1.getPlayers().get(0),
                team2.getPlayers().get(0),
                team1.getPlayers().get(1),
                team2.getPlayers().get(1)
        );
    }

    public BeloteRound createNewRound() {
        BeloteRound round = new BeloteRound(++currentRoundNumber, RoundStatus.CHOOSING_TRUMP);
        rounds.add(round);
        currentRound = round;
        return round;
    }

    public void startGame() {
        status = GameStatus.IN_PROGRESS;
    }
}
