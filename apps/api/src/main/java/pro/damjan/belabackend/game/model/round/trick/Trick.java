package pro.damjan.belabackend.game.model.round.trick;

import lombok.Getter;
import lombok.Setter;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.player.GamePlayer;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Getter
public class Trick implements Serializable {

    @Setter
    private int trickNumber; // 0-based index for tricks within a round
    private List<PlayedCard> playedCards = new ArrayList<>(); // List of cards played in this trick, in order of play

    @Setter
    private int winningPlayerIndex; // index of the player who won the trick (0-3)

    public boolean isComplete() {
        return playedCards.size() == 4;
    }

    public void addCard(PlayedCard card) {
        if (isComplete()) {
            throw new IllegalStateException("Cannot add card, trick is already complete");
        }

        boolean playerAlreadyPlayed = playedCards
                .stream()
                .anyMatch(playedCard -> playedCard.getPlayerIndex() == card.getPlayerIndex());
        if (playerAlreadyPlayed) {
            throw new IllegalStateException("Player has already played in this trick");
        }

        playedCards.add(card);
    }

    public int calculatePoints() {
        int points = 0;
        for (PlayedCard playedCard : playedCards) {
            Card card = playedCard.getCard();
            points += card.getPoints();
        }
        return points;
    }

}
