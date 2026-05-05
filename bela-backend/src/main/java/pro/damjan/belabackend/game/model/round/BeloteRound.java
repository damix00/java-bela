package pro.damjan.belabackend.game.model.round;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.model.round.trick.PlayedCard;
import pro.damjan.belabackend.game.model.round.trick.Trick;
import pro.damjan.belabackend.game.model.round.trick.TrickValidator;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Getter
public class BeloteRound implements Serializable {

    public record CardThrowResult(
            boolean legalMove,
            int trickNumber,
            boolean trickComplete,
            Integer winningPlayerIndex,
            boolean nextTrickPending
    ) {}

    private final int roundNumber;

    @Setter
    private RoundStatus roundStatus;

    @Setter
    private Suite trumpSuite;

    private int currentTurnIndex; // index of the player whose turn it is to play (0-3)

    private int startingPlayerIndex = 0; // index of the player who started the current round (0-3)

    private int currentTrickNumber = -1; // 0-based index for tricks within this round
    private List<Trick> tricks; // List of tricks played in this round, in order
    private Trick currentTrick;

    private List<Trick> tricksOrEmpty() {
        if (tricks == null) {
            tricks = new ArrayList<>();
        }

        return tricks;
    }

    public BeloteRound(int roundNumber, int startingPlayerIndex, RoundStatus roundStatus) {
        this.roundNumber = roundNumber;
        this.startingPlayerIndex = startingPlayerIndex;
        this.roundStatus = roundStatus;

        this.currentTurnIndex = startingPlayerIndex;
    }

    public boolean isChoosingTrump() {
        return roundStatus == RoundStatus.CHOOSING_TRUMP;
    }

    public boolean isLastTrumpChooser() {
        return currentTurnIndex == (startingPlayerIndex + 3) % 4;
    }

    public void passTrumpChoice() {
        if (!isChoosingTrump()) {
            throw new IllegalStateException("Cannot pass trump choice outside trump choosing phase");
        }

        if (isLastTrumpChooser()) {
            throw new IllegalStateException("Cannot pass trump choice for the last chooser");
        }

        advanceTurn();
    }

    public void chooseTrump(Suite suite) {
        if (!isChoosingTrump()) {
            throw new IllegalStateException("Cannot choose trump outside trump choosing phase");
        }

        this.trumpSuite = suite;
        this.roundStatus = RoundStatus.DECLARATIONS;
    }

    public void advanceTurn() {
        currentTurnIndex = (currentTurnIndex + 1) % 4;
    }

    public void setCurrentTurnIndex(int turnIndex) {
        if (turnIndex < 0 || turnIndex > 3) {
            throw new IllegalArgumentException("Turn index must be between 0 and 3");
        }
        this.currentTurnIndex = turnIndex;
    }

    public void startNewTrick() {
        if (currentTrick != null && !currentTrick.isComplete()) {
            throw new IllegalStateException("Cannot start a new trick while the current trick is still active");
        }

        currentTrick = new Trick();
        currentTrick.setTrickNumber(++currentTrickNumber);

        tricksOrEmpty().add(currentTrick);
    }

    public Trick getTrick(int trickNumber) {
        return tricksOrEmpty()
                .stream()
                .filter(trick -> trick.getTrickNumber() == trickNumber)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Trick not found: " + trickNumber));
    }

    public CardThrowResult throwCard(GamePlayer gamePlayer, Card card) {
        if (currentTrick == null || currentTrick.isComplete()) {
            throw new IllegalStateException("Cannot throw card, no active trick or current trick is already complete");
        }

        // TODO: Validate card can be played
        if (!TrickValidator.isLegalMove(currentTrick, card, trumpSuite, gamePlayer)) {
            return new CardThrowResult(false, currentTrickNumber, false, null, false);
        }

        if (gamePlayer.getSeatIndex() != currentTurnIndex) {
            throw new IllegalStateException("It's not the player's turn to play");
        }

        int playedTrickNumber = currentTrickNumber;

        currentTrick.addCard(new PlayedCard(
                gamePlayer.getSeatIndex(),
                card
        ));

        gamePlayer.removeCard(card);

        if (currentTrick.isComplete()) {
            int winningPlayerIndex = TrickValidator.determineTrickWinner(currentTrick, trumpSuite);
            currentTrick.setWinningPlayerIndex(winningPlayerIndex);
            currentTurnIndex = winningPlayerIndex;

            if (gamePlayer.getHand().isEmpty()) {
                roundStatus = RoundStatus.FINISHED;
                return new CardThrowResult(true, playedTrickNumber, true, winningPlayerIndex, false);
            }

            return new CardThrowResult(true, playedTrickNumber, true, winningPlayerIndex, true);
        }

        advanceTurn();
        return new CardThrowResult(true, playedTrickNumber, false, null, false);
    }
}
