package pro.damjan.belabackend.game.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

@Getter @Setter
public class TrumpChoosingStartedEvent extends OutgoingEvent {

    private int roundNumber;
    private int currentTurnIndex;
    private long timeoutSeconds;

    public TrumpChoosingStartedEvent(int roundNumber, int currentTurnIndex, long timeoutSeconds) {
        super("game:trumpChoosingStarted");
        this.roundNumber = roundNumber;
        this.currentTurnIndex = currentTurnIndex;
        this.timeoutSeconds = timeoutSeconds;
    }
}
