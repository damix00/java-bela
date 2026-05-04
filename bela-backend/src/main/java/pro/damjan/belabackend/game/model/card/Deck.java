package pro.damjan.belabackend.game.model.card;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Deck {

    private final List<Card> cards;

    public Deck() {
        cards = new ArrayList<>(32);
        for (Suite suite : Suite.values()) {
            for (Rank rank : Rank.values()) {
                cards.add(new Card(suite, rank, false));
            }
        }
    }

    public void shuffle() {
        Collections.shuffle(cards);
    }

    public List<Card> deal(int count) {
        List<Card> dealt = new ArrayList<>(cards.subList(0, count));
        cards.subList(0, count).clear();
        return dealt;
    }
}