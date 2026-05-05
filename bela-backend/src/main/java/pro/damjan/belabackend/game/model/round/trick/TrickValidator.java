package pro.damjan.belabackend.game.model.round.trick;

import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.model.player.GamePlayer;

public class TrickValidator {
    private static boolean hasStrongerCardInSuite(GamePlayer player, Card card, Suite suite) {
        for (Card playerCard : player.getHand()) {
            if (playerCard.getSuite() == suite && playerCard.isStrongerThan(card)) {
                return true;
            }
        }
        return false;
    }

    private static boolean hasSuiteCard(GamePlayer player, Suite suite) {
        for (Card playerCard : player.getHand()) {
            if (playerCard.getSuite() == suite) {
                return true;
            }
        }
        return false;
    }

    public static boolean isLegalMove(Trick currentTrick, Card cardToPlay, Suite trumpSuite, GamePlayer player) {
        if (currentTrick == null || currentTrick.isComplete()) {
            throw new IllegalStateException("Cannot validate move, no active trick or current trick is already complete");
        }

        if (currentTrick.getPlayedCards().isEmpty()) {
            // First card can be any card
            return true;
        }

        PlayedCard firstCard = currentTrick.getPlayedCards().getFirst();
        Suite leadingSuite = firstCard.getCard().getSuite();
        boolean hasLeadingSuite = hasSuiteCard(player, leadingSuite);
        boolean trumpPlayed = false;
        boolean trumpCutPlayed = false;
        Card strongestCard = currentTrick.getPlayedCards().getFirst().getCard();
        Card strongestTrump = null;

        for (PlayedCard playedCard : currentTrick.getPlayedCards()) {
            Card played = playedCard.getCard();
            if (played.isStrongerThan(strongestCard)) {
                strongestCard = played;
            }
        }

        for (PlayedCard playedCard : currentTrick.getPlayedCards()) {
            Card played = playedCard.getCard();
            if (played.getSuite() == trumpSuite) {
                trumpPlayed = true;
                trumpCutPlayed = leadingSuite != trumpSuite;
                if (strongestTrump == null || played.isStrongerThan(strongestTrump)) {
                    strongestTrump = played;
                }
            }
        }

        // If the player has a card of the leading suite, they must play it.
        if (hasLeadingSuite) {
            if (cardToPlay.getSuite() != leadingSuite) {
                return false;
            }

            return trumpCutPlayed
                    || !hasStrongerCardInSuite(player, strongestCard, leadingSuite)
                    || cardToPlay.isStrongerThan(strongestCard);
        }

        // If the player does not have a card of the leading suite:
        // If they have a trump card, they must play it.
        if (hasSuiteCard(player, trumpSuite) && cardToPlay.getSuite() != trumpSuite) {
            return false;
        }

        // If trump was already played and the player can beat it, they must play a stronger trump.
        if (trumpPlayed
                && strongestTrump != null
                && hasStrongerCardInSuite(player, strongestTrump, trumpSuite)
                && (cardToPlay.getSuite() != trumpSuite || !cardToPlay.isStrongerThan(strongestTrump))) {
            return false;
        }

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
