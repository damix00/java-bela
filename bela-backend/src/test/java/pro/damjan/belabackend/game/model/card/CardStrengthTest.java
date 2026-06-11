package pro.damjan.belabackend.game.model.card;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CardStrengthTest {

    @Test
    void nonTrumpNineBeatsEightAndSevenDespiteAllBeingWorthZeroPoints() {
        Card nine = new Card(Suite.HEARTS, Rank.NINE, false);
        Card eight = new Card(Suite.HEARTS, Rank.EIGHT, false);
        Card seven = new Card(Suite.HEARTS, Rank.SEVEN, false);

        assertThat(nine.isStrongerThan(eight)).isTrue();
        assertThat(eight.isStrongerThan(nine)).isFalse();
        assertThat(eight.isStrongerThan(seven)).isTrue();
        assertThat(nine.isStrongerThan(seven)).isTrue();
    }

    @Test
    void nonTrumpFollowsAceTenKingQueenJackOrder() {
        Card ace = new Card(Suite.BELLS, Rank.ACE, false);
        Card ten = new Card(Suite.BELLS, Rank.TEN, false);
        Card jack = new Card(Suite.BELLS, Rank.JACK, false);

        assertThat(ace.isStrongerThan(ten)).isTrue();
        assertThat(ten.isStrongerThan(jack)).isTrue();
        assertThat(jack.isStrongerThan(ace)).isFalse();
    }

    @Test
    void trumpJackBeatsNineWhichBeatsAce() {
        Card jack = new Card(Suite.ACORN, Rank.JACK, true);
        Card nine = new Card(Suite.ACORN, Rank.NINE, true);
        Card ace = new Card(Suite.ACORN, Rank.ACE, true);

        assertThat(jack.isStrongerThan(nine)).isTrue();
        assertThat(nine.isStrongerThan(ace)).isTrue();
        assertThat(ace.isStrongerThan(jack)).isFalse();
    }

    @Test
    void trumpEightBeatsSeven() {
        Card eight = new Card(Suite.LEAF, Rank.EIGHT, true);
        Card seven = new Card(Suite.LEAF, Rank.SEVEN, true);

        assertThat(eight.isStrongerThan(seven)).isTrue();
        assertThat(seven.isStrongerThan(eight)).isFalse();
    }

    @Test
    void anyTrumpBeatsAnyNonTrump() {
        Card trumpSeven = new Card(Suite.LEAF, Rank.SEVEN, true);
        Card nonTrumpAce = new Card(Suite.HEARTS, Rank.ACE, false);

        assertThat(trumpSeven.isStrongerThan(nonTrumpAce)).isTrue();
        assertThat(nonTrumpAce.isStrongerThan(trumpSeven)).isFalse();
    }

    @Test
    void differentNonTrumpSuitesCannotBeatEachOther() {
        Card heartsAce = new Card(Suite.HEARTS, Rank.ACE, false);
        Card bellsSeven = new Card(Suite.BELLS, Rank.SEVEN, false);

        assertThat(heartsAce.isStrongerThan(bellsSeven)).isFalse();
        assertThat(bellsSeven.isStrongerThan(heartsAce)).isFalse();
    }
}
