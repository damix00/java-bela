package pro.damjan.belabackend.game.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

@Getter @Setter
public class TrumpChoiceSkippedEvent extends OutgoingEvent {

    private int roundNumber;
    private int skippedTurnIndex;
    private int nextTurnIndex;
    private long timeoutSeconds;

    public TrumpChoiceSkippedEvent(int roundNumber, int skippedTurnIndex, int nextTurnIndex, long timeoutSeconds) {
        super("game:trumpChoiceSkipped");
        this.roundNumber = roundNumber;
        this.skippedTurnIndex = skippedTurnIndex;
        this.nextTurnIndex = nextTurnIndex;
        this.timeoutSeconds = timeoutSeconds;
    }
}
