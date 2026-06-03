package pro.damjan.belabackend.game.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.GameStatus;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

import java.io.Serializable;

@Getter @Setter
public class GameEndedEvent extends OutgoingEvent implements Serializable {

    private final int team1FinalScore;
    private final int team2FinalScore;
    private final int winningTeamIndex;
    private final GameStatus gameStatus;

    public GameEndedEvent(int team1FinalScore, int team2FinalScore, int winningTeamIndex, GameStatus gameStatus) {
        super("game:ended");
        this.team1FinalScore = team1FinalScore;
        this.team2FinalScore = team2FinalScore;
        this.winningTeamIndex = winningTeamIndex;
        this.gameStatus = gameStatus;
    }
}
