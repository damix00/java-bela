package pro.damjan.belabackend.game.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.card.Card;

import java.util.List;

/**
 * A seat said "dalje". Per-perspective, because passing is also when that player's own two
 * face-down cards flip: {@code revealedCards} is filled in only for the passer's own copy of the
 * event and is empty for everybody else's.
 */
@Getter @Setter
public class TrumpChoiceSkippedEvent extends PerspectiveOutgoingEvent {

    private int roundNumber;
    private int skippedTurnIndex;
    private int nextTurnIndex;
    private List<Card> revealedCards;
    private long timeoutSeconds;

    public TrumpChoiceSkippedEvent(
            String perspectiveUserId,
            int roundNumber,
            int skippedTurnIndex,
            int nextTurnIndex,
            List<Card> revealedCards,
            long timeoutSeconds
    ) {
        super("game:trumpChoiceSkipped", perspectiveUserId);
        this.roundNumber = roundNumber;
        this.skippedTurnIndex = skippedTurnIndex;
        this.nextTurnIndex = nextTurnIndex;
        this.revealedCards = revealedCards;
        this.timeoutSeconds = timeoutSeconds;
    }
}
