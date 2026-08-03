package pro.damjan.belabackend.game.model.card;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

class CardOrderingTest {

    @Test
    void sortsCardsBySuiteThenByClientRankOrder() {
        List<Card> sorted = CardOrdering.sortForClient(List.of(
                card(Suite.LEAF, Rank.SEVEN),
                card(Suite.HEARTS, Rank.TEN),
                card(Suite.BELLS, Rank.ACE),
                card(Suite.ACORN, Rank.KING),
                card(Suite.HEARTS, Rank.ACE),
                card(Suite.BELLS, Rank.NINE),
                card(Suite.ACORN, Rank.JACK),
                card(Suite.LEAF, Rank.QUEEN)
        ));

        assertThat(sorted)
                .extracting(Card::getSuite, Card::getRank)
                .containsExactly(
                        tuple(Suite.HEARTS, Rank.ACE),
                        tuple(Suite.HEARTS, Rank.TEN),
                        tuple(Suite.BELLS, Rank.ACE),
                        tuple(Suite.BELLS, Rank.NINE),
                        tuple(Suite.ACORN, Rank.KING),
                        tuple(Suite.ACORN, Rank.JACK),
                        tuple(Suite.LEAF, Rank.QUEEN),
                        tuple(Suite.LEAF, Rank.SEVEN)
                );
    }

    private Card card(Suite suite, Rank rank) {
        return new Card(suite, rank, false);
    }
}
