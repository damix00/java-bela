package pro.damjan.belabackend.game.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.round.RoundStatus;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

import java.util.List;

@Getter @Setter
public class RoundStartEvent extends OutgoingEvent {

    private int roundNumber;
    private RoundStatus roundStatus;
    private int currentTurnIndex;
    private List<Card> hand;

    public RoundStartEvent(int roundNumber, RoundStatus roundStatus, int currentTurnIndex, List<Card> visibleHand) {
        super("game:roundStart");
        this.roundNumber = roundNumber;
        this.roundStatus = roundStatus;
        this.currentTurnIndex = currentTurnIndex;
        this.hand = visibleHand;
    }
}
