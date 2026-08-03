package pro.damjan.belabackend.game.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

@Getter @Setter
public class CardTurnStartedEvent extends OutgoingEvent {

    private int roundNumber;
    private int trickNumber;
    private int currentTurnIndex;
    private long timeoutSeconds;

    public CardTurnStartedEvent(int roundNumber, int trickNumber, int currentTurnIndex, long timeoutSeconds) {
        super("game:cardTurnStarted");
        this.roundNumber = roundNumber;
        this.trickNumber = trickNumber;
        this.currentTurnIndex = currentTurnIndex;
        this.timeoutSeconds = timeoutSeconds;
    }
}
