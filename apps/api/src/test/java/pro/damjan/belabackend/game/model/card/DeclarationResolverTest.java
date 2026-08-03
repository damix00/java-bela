package pro.damjan.belabackend.game.model.card;

import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.game.model.player.GamePlayer;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DeclarationResolverTest {

    @Test
    void winningTeamKeepsAllTeamDeclarationsAndOtherTeamGetsNone() {
        List<GamePlayer> players = players(
                List.of(
                        card(Suite.HEARTS, Rank.JACK),
                        card(Suite.BELLS, Rank.JACK),
                        card(Suite.ACORN, Rank.JACK),
                        card(Suite.LEAF, Rank.JACK),
                        card(Suite.HEARTS, Rank.SEVEN)
                ),
                List.of(
                        card(Suite.HEARTS, Rank.NINE),
                        card(Suite.BELLS, Rank.NINE),
                        card(Suite.ACORN, Rank.NINE),
                        card(Suite.LEAF, Rank.NINE)
                ),
                List.of(
                        card(Suite.HEARTS, Rank.ACE),
                        card(Suite.HEARTS, Rank.KING),
                        card(Suite.HEARTS, Rank.QUEEN)
                ),
                List.of(card(Suite.BELLS, Rank.SEVEN))
        );

        DeclarationResolver.Result result = DeclarationResolver.resolve(players, 0);

        assertThat(result.winningTeamIndex()).isZero();
        assertThat(result.team1Declarations())
                .extracting(Declaration::getType)
                .containsExactly(Declaration.Type.FOUR_JACKS, Declaration.Type.SEQUENCE_3);
        assertThat(result.team1Declarations()).extracting(Declaration::getPlayerIndex).containsExactly(0, 2);
        assertThat(result.team1Declarations()).extracting(Declaration::getPoints).containsExactly(200, 20);
        assertThat(result.team2Declarations()).isEmpty();
    }

    @Test
    void sequenceTieUsesStrongerHighCardBeforeTurnOrder() {
        List<GamePlayer> players = players(
                List.of(
                        card(Suite.HEARTS, Rank.KING),
                        card(Suite.HEARTS, Rank.QUEEN),
                        card(Suite.HEARTS, Rank.JACK)
                ),
                List.of(
                        card(Suite.BELLS, Rank.ACE),
                        card(Suite.BELLS, Rank.KING),
                        card(Suite.BELLS, Rank.QUEEN)
                ),
                List.of(card(Suite.ACORN, Rank.SEVEN)),
                List.of(card(Suite.LEAF, Rank.SEVEN))
        );

        DeclarationResolver.Result result = DeclarationResolver.resolve(players, 0);

        assertThat(result.winningTeamIndex()).isOne();
        assertThat(result.team1Declarations()).isEmpty();
        assertThat(result.team2Declarations())
                .singleElement()
                .extracting(Declaration::getPlayerIndex, Declaration::getType)
                .containsExactly(1, Declaration.Type.SEQUENCE_3);
    }

    @Test
    void equalSequencesUseRoundStartingPlayerOrder() {
        List<GamePlayer> players = players(
                List.of(card(Suite.HEARTS, Rank.SEVEN)),
                List.of(
                        card(Suite.HEARTS, Rank.ACE),
                        card(Suite.HEARTS, Rank.KING),
                        card(Suite.HEARTS, Rank.QUEEN)
                ),
                List.of(
                        card(Suite.BELLS, Rank.ACE),
                        card(Suite.BELLS, Rank.KING),
                        card(Suite.BELLS, Rank.QUEEN)
                ),
                List.of(card(Suite.LEAF, Rank.SEVEN))
        );

        DeclarationResolver.Result result = DeclarationResolver.resolve(players, 2);

        assertThat(result.winningTeamIndex()).isZero();
        assertThat(result.team1Declarations())
                .singleElement()
                .extracting(Declaration::getPlayerIndex)
                .isEqualTo(2);
        assertThat(result.team2Declarations()).isEmpty();
    }

    @Test
    void fourSevensAndEightsDoNotCount() {
        List<GamePlayer> players = players(
                List.of(
                        card(Suite.HEARTS, Rank.SEVEN),
                        card(Suite.BELLS, Rank.SEVEN),
                        card(Suite.ACORN, Rank.SEVEN),
                        card(Suite.LEAF, Rank.SEVEN)
                ),
                List.of(
                        card(Suite.HEARTS, Rank.EIGHT),
                        card(Suite.BELLS, Rank.EIGHT),
                        card(Suite.ACORN, Rank.EIGHT),
                        card(Suite.LEAF, Rank.EIGHT)
                ),
                List.of(card(Suite.ACORN, Rank.SEVEN)),
                List.of(card(Suite.LEAF, Rank.SEVEN))
        );

        DeclarationResolver.Result result = DeclarationResolver.resolve(players, 0);

        assertThat(result.hasWinningTeam()).isFalse();
        assertThat(result.team1Declarations()).isEmpty();
        assertThat(result.team2Declarations()).isEmpty();
    }

    @Test
    void eightCardsOfOneSuiteResolvesAsBelotImmediateWin() {
        List<GamePlayer> players = players(
                List.of(
                        card(Suite.HEARTS, Rank.SEVEN),
                        card(Suite.HEARTS, Rank.EIGHT),
                        card(Suite.HEARTS, Rank.NINE),
                        card(Suite.HEARTS, Rank.TEN),
                        card(Suite.HEARTS, Rank.JACK),
                        card(Suite.HEARTS, Rank.QUEEN),
                        card(Suite.HEARTS, Rank.KING),
                        card(Suite.HEARTS, Rank.ACE)
                ),
                List.of(card(Suite.BELLS, Rank.SEVEN)),
                List.of(card(Suite.ACORN, Rank.SEVEN)),
                List.of(card(Suite.LEAF, Rank.SEVEN))
        );

        DeclarationResolver.Result result = DeclarationResolver.resolve(players, 0);

        assertThat(result.belot()).isTrue();
        assertThat(result.winningTeamIndex()).isZero();
        assertThat(result.team1Declarations())
                .singleElement()
                .extracting(Declaration::getType, Declaration::getPoints)
                .containsExactly(Declaration.Type.BELOTE, 162);
        assertThat(result.team2Declarations()).isEmpty();
    }

    private List<GamePlayer> players(List<Card> p0, List<Card> p1, List<Card> p2, List<Card> p3) {
        List<GamePlayer> players = List.of(
                new GamePlayer("p0", 0),
                new GamePlayer("p1", 1),
                new GamePlayer("p2", 2),
                new GamePlayer("p3", 3)
        );
        players.get(0).receiveCards(p0);
        players.get(1).receiveCards(p1);
        players.get(2).receiveCards(p2);
        players.get(3).receiveCards(p3);
        return players;
    }

    private Card card(Suite suite, Rank rank) {
        return new Card(suite, rank, false);
    }
}
