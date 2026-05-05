package pro.damjan.belabackend.game.model.round.trick;

import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Rank;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.model.player.GamePlayer;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TrickValidatorTest {

    private static final Suite TRUMP_SUITE = Suite.LEAF;

    @Test
    void requiresStrongerLeadingSuiteCardWhenNoTrumpHasBeenPlayed() {
        Trick trick = trickWith(
                played(0, card(Suite.HEARTS, Rank.TEN))
        );
        Card lowerHeart = card(Suite.HEARTS, Rank.KING);
        Card strongerHeart = card(Suite.HEARTS, Rank.ACE);
        GamePlayer player = playerWith(lowerHeart, strongerHeart);

        assertThat(TrickValidator.isLegalMove(trick, lowerHeart, TRUMP_SUITE, player)).isFalse();
        assertThat(TrickValidator.isLegalMove(trick, strongerHeart, TRUMP_SUITE, player)).isTrue();
    }

    @Test
    void allowsLowerLeadingSuiteCardWhenPlayerCannotBeatCurrentStrongestCard() {
        Trick trick = trickWith(
                played(0, card(Suite.HEARTS, Rank.ACE))
        );
        Card lowerHeart = card(Suite.HEARTS, Rank.KING);
        GamePlayer player = playerWith(lowerHeart);

        assertThat(TrickValidator.isLegalMove(trick, lowerHeart, TRUMP_SUITE, player)).isTrue();
    }

    @Test
    void doesNotRequireStrongerLeadingSuiteCardAfterTrumpHasBeenPlayed() {
        Trick trick = trickWith(
                played(0, card(Suite.HEARTS, Rank.TEN)),
                played(1, trump(Rank.NINE))
        );
        Card lowerHeart = card(Suite.HEARTS, Rank.KING);
        Card strongerHeart = card(Suite.HEARTS, Rank.ACE);
        GamePlayer player = playerWith(lowerHeart, strongerHeart);

        assertThat(TrickValidator.isLegalMove(trick, lowerHeart, TRUMP_SUITE, player)).isTrue();
    }

    @Test
    void requiresStrongerCardWhenLeadingSuiteIsTrumpAndPlayerCanBeatIt() {
        Trick trick = trickWith(
                played(0, trump(Rank.NINE))
        );
        Card lowerTrump = trump(Rank.ACE);
        Card strongerTrump = trump(Rank.JACK);
        GamePlayer player = playerWith(lowerTrump, strongerTrump);

        assertThat(TrickValidator.isLegalMove(trick, lowerTrump, TRUMP_SUITE, player)).isFalse();
        assertThat(TrickValidator.isLegalMove(trick, strongerTrump, TRUMP_SUITE, player)).isTrue();
    }

    @Test
    void requiresStrongerTrumpWhenPlayerIsVoidInLeadingSuiteAndCanOvertrump() {
        Trick trick = trickWith(
                played(0, card(Suite.HEARTS, Rank.ACE)),
                played(1, trump(Rank.NINE))
        );
        Card lowerTrump = trump(Rank.ACE);
        Card strongerTrump = trump(Rank.JACK);
        GamePlayer player = playerWith(card(Suite.ACORN, Rank.ACE), lowerTrump, strongerTrump);

        assertThat(TrickValidator.isLegalMove(trick, lowerTrump, TRUMP_SUITE, player)).isFalse();
        assertThat(TrickValidator.isLegalMove(trick, strongerTrump, TRUMP_SUITE, player)).isTrue();
    }

    @Test
    void allowsAnyTrumpWhenPlayerIsVoidInLeadingSuiteAndCannotOvertrump() {
        Trick trick = trickWith(
                played(0, card(Suite.HEARTS, Rank.ACE)),
                played(1, trump(Rank.JACK))
        );
        Card lowerTrump = trump(Rank.NINE);
        GamePlayer player = playerWith(card(Suite.ACORN, Rank.ACE), lowerTrump);

        assertThat(TrickValidator.isLegalMove(trick, lowerTrump, TRUMP_SUITE, player)).isTrue();
    }

    private Trick trickWith(PlayedCard... playedCards) {
        Trick trick = new Trick();
        for (PlayedCard playedCard : playedCards) {
            trick.addCard(playedCard);
        }
        return trick;
    }

    private PlayedCard played(int playerIndex, Card card) {
        return new PlayedCard(playerIndex, card);
    }

    private GamePlayer playerWith(Card... cards) {
        GamePlayer player = new GamePlayer("player", 2);
        player.receiveCards(List.of(cards));
        return player;
    }

    private Card card(Suite suite, Rank rank) {
        return new Card(suite, rank, false);
    }

    private Card trump(Rank rank) {
        return new Card(TRUMP_SUITE, rank, true);
    }
}
