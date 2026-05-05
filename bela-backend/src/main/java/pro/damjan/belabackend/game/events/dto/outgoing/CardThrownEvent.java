package pro.damjan.belabackend.game.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

@Getter @Setter
public class CardThrownEvent extends OutgoingEvent {

    private int roundNumber;
    private int trickNumber;
    private int playerIndex;
    private Card card;
    private boolean expired;
    private boolean trickComplete;
    private boolean nextTrickPending;
    private Integer winningPlayerIndex;
    private int nextTurnIndex;
    private long timeoutSeconds;
    private int team1RoundPoints;
    private int team2RoundPoints;
    private int team1TotalScore;
    private int team2TotalScore;

    public CardThrownEvent(
            int roundNumber,
            int trickNumber,
            int playerIndex,
            Card card,
            boolean expired,
            boolean trickComplete,
            boolean nextTrickPending,
            Integer winningPlayerIndex,
            int nextTurnIndex,
            long timeoutSeconds,
            int team1RoundPoints,
            int team2RoundPoints,
            int team1TotalScore,
            int team2TotalScore
    ) {
        super("game:cardThrown");
        this.roundNumber = roundNumber;
        this.trickNumber = trickNumber;
        this.playerIndex = playerIndex;
        this.card = card;
        this.expired = expired;
        this.trickComplete = trickComplete;
        this.nextTrickPending = nextTrickPending;
        this.winningPlayerIndex = winningPlayerIndex;
        this.nextTurnIndex = nextTurnIndex;
        this.timeoutSeconds = timeoutSeconds;
        this.team1RoundPoints = team1RoundPoints;
        this.team2RoundPoints = team2RoundPoints;
        this.team1TotalScore = team1TotalScore;
        this.team2TotalScore = team2TotalScore;
    }
}
