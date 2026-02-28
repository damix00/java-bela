package pro.damjan.belabackend.game.model.card;

import lombok.Getter;

import java.io.Serializable;

@Getter
public class Card implements Serializable {
    private CardSuite cardSuite;
    private CardRank cardRank;

    public Card(CardSuite cardSuite, CardRank cardRank) {
        this.cardSuite = cardSuite;
        this.cardRank = cardRank;
    }
}
