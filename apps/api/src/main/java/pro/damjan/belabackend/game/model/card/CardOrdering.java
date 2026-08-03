package pro.damjan.belabackend.game.model.card;

import java.util.Comparator;
import java.util.List;

public final class CardOrdering {

    private static final Comparator<Card> CLIENT_HAND_COMPARATOR = Comparator
            .comparing(Card::getSuite, Comparator.comparingInt(CardOrdering::suiteOrder))
            .thenComparing(Card::getRank, Comparator.comparingInt(CardOrdering::rankOrder));

    private CardOrdering() {}

    public static List<Card> sortForClient(List<Card> cards) {
        return cards.stream()
                .sorted(CLIENT_HAND_COMPARATOR)
                .toList();
    }

    private static int suiteOrder(Suite suite) {
        return switch (suite) {
            case HEARTS -> 0;
            case BELLS -> 1;
            case ACORN -> 2;
            case LEAF -> 3;
        };
    }

    private static int rankOrder(Rank rank) {
        return switch (rank) {
            case ACE -> 0;
            case KING -> 1;
            case QUEEN -> 2;
            case JACK -> 3;
            case TEN -> 4;
            case NINE -> 5;
            case EIGHT -> 6;
            case SEVEN -> 7;
        };
    }
}
