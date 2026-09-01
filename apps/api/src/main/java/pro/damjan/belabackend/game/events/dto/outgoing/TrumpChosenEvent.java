package pro.damjan.belabackend.game.events.dto.outgoing;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Declaration;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.model.round.RoundStatus;

import java.util.List;

@Getter @Setter
public class TrumpChosenEvent extends PerspectiveOutgoingEvent {

    private int roundNumber;
    private int chosenByTurnIndex;
    private int currentTurnIndex;
    private Suite trumpSuite;
    private RoundStatus roundStatus;
    private List<Card> hand;
    private List<Card> revealedCards;
    private int team1RoundPoints;
    private int team2RoundPoints;
    // Points taken in tricks, with no zvanja in them. The scoreboard counts the two apart: what
    // the cards have won so far, and the declarations sitting on top of it.
    private int team1CardPoints;
    private int team2CardPoints;
    private int team1TotalScore;
    private int team2TotalScore;
    private List<Declaration> team1Declarations;
    private List<Declaration> team2Declarations;
    // This player's own zvanja, so the prompt can name what they are being asked about. Nobody
    // else's holdings travel with it — the team lists stay empty until the reveal.
    private List<Declaration> myDeclarations;
    private long timeoutSeconds;

    public TrumpChosenEvent(
            String perspectiveUserId,
            int roundNumber,
            int chosenByTurnIndex,
            int currentTurnIndex,
            Suite trumpSuite,
            RoundStatus roundStatus,
            List<Card> hand,
            List<Card> revealedCards,
            int team1RoundPoints,
            int team2RoundPoints,
            int team1CardPoints,
            int team2CardPoints,
            int team1TotalScore,
            int team2TotalScore,
            List<Declaration> team1Declarations,
            List<Declaration> team2Declarations,
            List<Declaration> myDeclarations,
            long timeoutSeconds
    ) {
        super("game:trumpChosen", perspectiveUserId);
        this.roundNumber = roundNumber;
        this.chosenByTurnIndex = chosenByTurnIndex;
        this.currentTurnIndex = currentTurnIndex;
        this.trumpSuite = trumpSuite;
        this.roundStatus = roundStatus;
        this.hand = hand;
        this.revealedCards = revealedCards;
        this.team1RoundPoints = team1RoundPoints;
        this.team2RoundPoints = team2RoundPoints;
        this.team1CardPoints = team1CardPoints;
        this.team2CardPoints = team2CardPoints;
        this.team1TotalScore = team1TotalScore;
        this.team2TotalScore = team2TotalScore;
        this.team1Declarations = team1Declarations;
        this.team2Declarations = team2Declarations;
        this.myDeclarations = myDeclarations;
        this.timeoutSeconds = timeoutSeconds;
    }
}
