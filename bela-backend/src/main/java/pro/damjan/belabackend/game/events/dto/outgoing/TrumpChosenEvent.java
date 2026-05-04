package pro.damjan.belabackend.game.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.model.round.RoundStatus;

import java.util.List;

@Getter @Setter
public class TrumpChosenEvent extends PerspectiveOutgoingEvent {

    private int roundNumber;
    private int chosenByTurnIndex;
    private Suite trumpSuite;
    private RoundStatus roundStatus;
    private List<Card> revealedCards;

    public TrumpChosenEvent(
            String perspectiveUserId,
            int roundNumber,
            int chosenByTurnIndex,
            Suite trumpSuite,
            RoundStatus roundStatus,
            List<Card> revealedCards
    ) {
        super("game:trumpChosen", perspectiveUserId);
        this.roundNumber = roundNumber;
        this.chosenByTurnIndex = chosenByTurnIndex;
        this.trumpSuite = trumpSuite;
        this.roundStatus = roundStatus;
        this.revealedCards = revealedCards;
    }
}
