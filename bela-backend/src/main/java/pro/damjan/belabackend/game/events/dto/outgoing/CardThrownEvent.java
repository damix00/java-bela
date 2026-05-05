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
            long timeoutSeconds
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
    }
}
