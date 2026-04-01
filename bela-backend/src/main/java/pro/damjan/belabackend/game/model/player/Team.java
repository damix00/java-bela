package pro.damjan.belabackend.game.model.player;

import lombok.Getter;

import java.io.Serializable;
import java.util.Arrays;
import java.util.List;

@Getter
public class Team implements Serializable {

    private List<GamePlayer> players;
    private int totalScore;

    private Team(List<GamePlayer> players) {
        this.players = players;
        this.totalScore = 0;
    }

    public static TeamPair pairFrom(List<GamePlayer> players) {
        if (players.size() != 4) {
            throw new IllegalArgumentException("Exactly 4 players are required to form teams");
        }

        return new TeamPair(
                buildTeam(players, 0, 2),
                buildTeam(players, 1, 3)
        );
    }

    private static Team buildTeam(List<GamePlayer> players, int... seats) {
        List<GamePlayer> members = Arrays.stream(seats)
                .mapToObj(seat -> {
                    GamePlayer p = players.get(seat);
                    p.setSeatIndex(seat);
                    return p;
                })
                .toList();
        return new Team(members);
    }
}
