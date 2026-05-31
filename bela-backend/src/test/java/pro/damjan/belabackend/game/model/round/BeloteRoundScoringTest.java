package pro.damjan.belabackend.game.model.round;

import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Declaration;
import pro.damjan.belabackend.game.model.card.Rank;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.model.player.GamePlayer;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class BeloteRoundScoringTest {

    private static final Suite TRUMP = Suite.HEARTS;

    @Test
    void callerKeepsPointsWhenWinningStrictMajority() {
        BeloteRound round = finishedRoundWithCaller(0);
        round.getRoundTeam(0).addCardPoints(82);
        round.getRoundTeam(1).addCardPoints(80);

        assertThat(round.getTeam1RoundScore()).isEqualTo(82);
        assertThat(round.getTeam2RoundScore()).isEqualTo(80);
    }

    @Test
    void callerFallsOnExactTie() {
        BeloteRound round = finishedRoundWithCaller(0);
        round.getRoundTeam(0).addCardPoints(81);
        round.getRoundTeam(1).addCardPoints(81);

        // An exact 50/50 split means the calling team falls (pao).
        assertThat(round.getTeam1RoundScore()).isEqualTo(0);
        assertThat(round.getTeam2RoundScore()).isEqualTo(162);
    }

    @Test
    void fallenCallerHandsAllPointsIncludingDeclarationsToOpponent() {
        BeloteRound round = finishedRoundWithCaller(0);
        round.getRoundTeam(0).addCardPoints(40);
        round.getRoundTeam(0).addDeclaration(
                new Declaration(Declaration.Type.SEQUENCE_3, 0, List.of()));
        round.getRoundTeam(1).addCardPoints(122);

        // Caller fell: opponent takes everything on the table (40 + 20 + 122 = 182).
        assertThat(round.getTeam1RoundScore()).isEqualTo(0);
        assertThat(round.getTeam2RoundScore()).isEqualTo(182);
    }

    @Test
    void belaIsAwardedWhenTrumpKingAndQueenArePlayed() {
        BeloteRound round = new BeloteRound(0, 0, RoundStatus.CHOOSING_TRUMP);
        round.chooseTrump(TRUMP);
        round.setRoundStatus(RoundStatus.PLAYING);

        GamePlayer p0 = player("p0", 0, List.of(
                card(TRUMP, Rank.KING), card(TRUMP, Rank.QUEEN)));
        GamePlayer p1 = player("p1", 1, List.of(
                card(Suite.BELLS, Rank.SEVEN), card(Suite.BELLS, Rank.EIGHT)));
        GamePlayer p2 = player("p2", 2, List.of(
                card(Suite.ACORN, Rank.SEVEN), card(Suite.ACORN, Rank.EIGHT)));
        GamePlayer p3 = player("p3", 3, List.of(
                card(Suite.LEAF, Rank.SEVEN), card(Suite.LEAF, Rank.EIGHT)));
        List<GamePlayer> players = List.of(p0, p1, p2, p3);

        // Trick 1: seat 0 leads trump KING and wins it.
        round.startNewTrick();
        BeloteRound.CardThrowResult kingResult = playFromHand(round, p0);
        playFromHand(round, p1);
        playFromHand(round, p2);
        playFromHand(round, p3);
        assertThat(kingResult.bela()).isFalse(); // queen not played yet

        // Trick 2: seat 0 (the winner) leads trump QUEEN, completing the bela.
        round.startNewTrick();
        BeloteRound.CardThrowResult queenResult = playFromHand(round, p0);

        assertThat(queenResult.bela()).isTrue();
        assertThat(round.getRoundTeam(0).getDeclarationPoints()).isEqualTo(20);
    }

    @Test
    void allTricksSweepAwardsStigljaBonus() {
        BeloteRound round = new BeloteRound(0, 0, RoundStatus.CHOOSING_TRUMP);
        round.chooseTrump(TRUMP);
        round.setRoundStatus(RoundStatus.PLAYING);

        // Seat 0 holds every trump, so team 0 (seats 0 & 2) sweeps all eight tricks.
        GamePlayer p0 = player("p0", 0, allOfSuite(TRUMP));
        GamePlayer p1 = player("p1", 1, allOfSuite(Suite.BELLS));
        GamePlayer p2 = player("p2", 2, allOfSuite(Suite.ACORN));
        GamePlayer p3 = player("p3", 3, allOfSuite(Suite.LEAF));

        for (int trick = 0; trick < 8; trick++) {
            round.startNewTrick();
            playFromHand(round, p0);
            playFromHand(round, p1);
            playFromHand(round, p2);
            playFromHand(round, p3);
        }

        assertThat(round.getRoundStatus()).isEqualTo(RoundStatus.FINISHED);
        // 152 card points + 10 last-trick + 90 štiglja bonus.
        assertThat(round.getRoundTeam(0).getCardPoints()).isEqualTo(252);
        assertThat(round.getRoundTeam(1).getCardPoints()).isEqualTo(0);
    }

    private BeloteRound finishedRoundWithCaller(int callerTeamSeat) {
        BeloteRound round = new BeloteRound(0, callerTeamSeat, RoundStatus.CHOOSING_TRUMP);
        round.chooseTrump(TRUMP); // marks the current turn's team as the caller
        round.setRoundStatus(RoundStatus.FINISHED);
        return round;
    }

    private BeloteRound.CardThrowResult playFromHand(BeloteRound round, GamePlayer player) {
        Card card = player.getHand().getFirst();
        return round.throwCard(player, card);
    }

    private GamePlayer player(String userId, int seat, List<Card> hand) {
        GamePlayer player = new GamePlayer(userId, seat);
        player.receiveCards(new ArrayList<>(hand));
        player.updateTrumpSuite(TRUMP);
        return player;
    }

    private Card card(Suite suite, Rank rank) {
        return new Card(suite, rank, suite == TRUMP);
    }

    private List<Card> allOfSuite(Suite suite) {
        List<Card> cards = new ArrayList<>();
        for (Rank rank : Rank.values()) {
            cards.add(card(suite, rank));
        }
        return cards;
    }
}
