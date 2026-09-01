package pro.damjan.belabackend.game.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.card.Declaration;
import pro.damjan.belabackend.game.model.round.RoundStatus;
import pro.damjan.belabackend.websocket.events.dto.OutgoingEvent;

import java.util.List;

/**
 * The ask window is over and the contest is resolved: here is what the table declared. Everyone
 * sees the same thing, which is the whole point of it arriving in its own event rather than riding
 * along with the question.
 */
@Getter @Setter
public class DeclarationsRevealedEvent extends OutgoingEvent {

    private int roundNumber;
    private RoundStatus roundStatus;
    private List<Declaration> team1Declarations;
    private List<Declaration> team2Declarations;
    private List<Integer> declinedDeclarationSeats;
    private long timeoutSeconds;

    public DeclarationsRevealedEvent(
            int roundNumber,
            RoundStatus roundStatus,
            List<Declaration> team1Declarations,
            List<Declaration> team2Declarations,
            List<Integer> declinedDeclarationSeats,
            long timeoutSeconds
    ) {
        super("game:declarationsRevealed");
        this.roundNumber = roundNumber;
        this.roundStatus = roundStatus;
        this.team1Declarations = team1Declarations;
        this.team2Declarations = team2Declarations;
        this.declinedDeclarationSeats = declinedDeclarationSeats;
        this.timeoutSeconds = timeoutSeconds;
    }
}
