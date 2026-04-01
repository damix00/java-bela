package pro.damjan.belabackend.game.model.round.trick;

import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.model.player.GamePlayer;

public class TrickValidator {
    public static boolean isLegalMove(Trick currentTrick, Card cardToPlay, Suite trumpSuite, GamePlayer player) {
        if (currentTrick == null || currentTrick.isComplete()) {
            throw new IllegalStateException("Cannot validate move, no active trick or current trick is already complete");
        }

        if (currentTrick.getPlayedCards().isEmpty()) {
            // First card can be any card
            return true;
        }

        Card firstCard = currentTrick.getPlayedCards().getFirst().getCard();
        Suite leadingSuite = firstCard.getSuite();

        // TODO: Implement rule validation
        // returns true for now

        return true;
    }

    /**
     * Determines the winner of a completed trick based on the cards played and the trump suite.
     *
     * @param trick the completed trick to evaluate
     * @param trumpSuite the trump suite for the current round
     * @return the index of the player who won the trick (0-3)
     * @throws IllegalStateException if the trick is not complete
     */
    public static int determineTrickWinner(Trick trick, Suite trumpSuite) {
        if (!trick.isComplete()) {
            throw new IllegalStateException("Cannot determine winner, trick is not complete");
        }

        PlayedCard strongestCard = trick.getPlayedCards().getFirst();

        for (int i = 1; i < trick.getPlayedCards().size(); i++) {
            PlayedCard playedCard = trick.getPlayedCards().get(i);

            if (playedCard.getCard().isStrongerThan(strongestCard.getCard())) {
                strongestCard = playedCard;
            }
        }

        return strongestCard.getPlayerIndex();
    }
}
