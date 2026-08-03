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
        round.getRoundPlayer(0).addDeclaration(
                new Declaration(Declaration.Type.SEQUENCE_3, 0, List.of()));
        round.getRoundTeam(1).addCardPoints(122);

        // Caller fell: opponent takes everything on the table (40 + 20 + 122 = 182).
        assertThat(round.getTeam1RoundScore()).isEqualTo(0);
        assertThat(round.getTeam2RoundScore()).isEqualTo(182);
    }

    @Test
    void belaIsAwardedWhenDeclaredOnFirstTrumpKingQueenCard() {
        BeloteRound round = playingRound();
        List<GamePlayer> players = belaPlayers();

        // Trick 1: seat 0 leads trump KING and declares bela on this first card.
        round.startNewTrick();
        BeloteRound.CardThrowResult kingResult = playFromHand(round, players.get(0), true);
        playFromHand(round, players.get(1));
        playFromHand(round, players.get(2));
        playFromHand(round, players.get(3));
        assertThat(kingResult.bela()).isFalse(); // queen not played yet

        // Trick 2: seat 0 leads trump QUEEN, completing the (already-declared) bela.
        round.startNewTrick();
        BeloteRound.CardThrowResult queenResult = playFromHand(round, players.get(0), false);

        assertThat(queenResult.bela()).isTrue();
        assertThat(declarationPoints(round, 0)).isEqualTo(20);
    }

    @Test
    void belaIsAwardedWhenDeclaredOnlyOnSecondCard() {
        BeloteRound round = playingRound();
        List<GamePlayer> players = belaPlayers();

        // First card thrown WITHOUT declaring (e.g. accidentally declined)...
        round.startNewTrick();
        playFromHand(round, players.get(0), false);
        playFromHand(round, players.get(1));
        playFromHand(round, players.get(2));
        playFromHand(round, players.get(3));

        // ...then declared on the completing second card — still awarded.
        round.startNewTrick();
        BeloteRound.CardThrowResult queenResult = playFromHand(round, players.get(0), true);

        assertThat(queenResult.bela()).isTrue();
        assertThat(declarationPoints(round, 0)).isEqualTo(20);
    }

    @Test
    void belaIsNotAwardedWhenNeverDeclared() {
        BeloteRound round = playingRound();
        List<GamePlayer> players = belaPlayers();

        round.startNewTrick();
        playFromHand(round, players.get(0), false);
        playFromHand(round, players.get(1));
        playFromHand(round, players.get(2));
        playFromHand(round, players.get(3));

        round.startNewTrick();
        BeloteRound.CardThrowResult queenResult = playFromHand(round, players.get(0), false);

        assertThat(queenResult.bela()).isFalse();
        assertThat(declarationPoints(round, 0)).isZero();
    }

    @Test
    void declinedDeclarationsDropFromTeamScore() {
        BeloteRound round = new BeloteRound(0, 0, RoundStatus.CHOOSING_TRUMP);
        round.chooseTrump(TRUMP);
        round.setRoundStatus(RoundStatus.DECLARATIONS);

        // Seat 0 (team 0) holds the only declaration.
        round.getRoundPlayer(0).addDeclaration(
                new Declaration(Declaration.Type.SEQUENCE_3, 0, List.of()));

        assertThat(declarationPoints(round, 0)).isEqualTo(20);

        round.declineDeclarations(0);

        assertThat(declarationPoints(round, 0)).isZero();
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

    @Test
    void currentTrickIsAlwaysTheLastTrickInTheList() {
        // The current trick must be derived from the tricks list, not a duplicate field. Storing it
        // separately de-aliased it from the list across a persistence round trip, freezing the list
        // copy empty and corrupting bela / štiglja scoring.
        BeloteRound round = new BeloteRound(0, 0, RoundStatus.CHOOSING_TRUMP);
        round.chooseTrump(TRUMP);
        round.setRoundStatus(RoundStatus.PLAYING);

        GamePlayer p0 = player("p0", 0, List.of(card(TRUMP, Rank.ACE), card(Suite.BELLS, Rank.SEVEN)));
        GamePlayer p1 = player("p1", 1, List.of(card(Suite.BELLS, Rank.EIGHT), card(Suite.BELLS, Rank.NINE)));
        GamePlayer p2 = player("p2", 2, List.of(card(Suite.ACORN, Rank.SEVEN), card(Suite.ACORN, Rank.EIGHT)));
        GamePlayer p3 = player("p3", 3, List.of(card(Suite.LEAF, Rank.SEVEN), card(Suite.LEAF, Rank.EIGHT)));

        round.startNewTrick();
        assertThat(round.getCurrentTrick()).isSameAs(round.getTricks().getLast());

        // Complete the first trick, then a second can begin and the derived getter tracks it.
        playFromHand(round, p0);
        playFromHand(round, p1);
        playFromHand(round, p2);
        playFromHand(round, p3);

        round.startNewTrick();
        assertThat(round.getCurrentTrick()).isSameAs(round.getTricks().getLast());
        assertThat(round.getTricks()).hasSize(2);
    }

    @Test
    void completedTricksRemainRetrievableWithTheirWinners() {
        BeloteRound round = new BeloteRound(0, 0, RoundStatus.CHOOSING_TRUMP);
        round.chooseTrump(TRUMP);
        round.setRoundStatus(RoundStatus.PLAYING);

        GamePlayer p0 = player("p0", 0, List.of(card(TRUMP, Rank.ACE), card(Suite.BELLS, Rank.SEVEN)));
        GamePlayer p1 = player("p1", 1, List.of(card(Suite.BELLS, Rank.EIGHT), card(Suite.BELLS, Rank.NINE)));
        GamePlayer p2 = player("p2", 2, List.of(card(Suite.ACORN, Rank.SEVEN), card(Suite.ACORN, Rank.EIGHT)));
        GamePlayer p3 = player("p3", 3, List.of(card(Suite.LEAF, Rank.SEVEN), card(Suite.LEAF, Rank.EIGHT)));

        // Trick 0: p0 cuts with a trump and wins; the completed trick must stay in the list.
        round.startNewTrick();
        playFromHand(round, p0);
        playFromHand(round, p1);
        playFromHand(round, p2);
        playFromHand(round, p3);

        round.startNewTrick(); // appends trick 1; trick 0 must not be lost or overwritten

        assertThat(round.getTrick(0).getPlayedCards()).hasSize(4);
        assertThat(round.getTrick(0).getWinningPlayerIndex()).isEqualTo(0);
    }

    private BeloteRound finishedRoundWithCaller(int callerTeamSeat) {
        BeloteRound round = new BeloteRound(0, callerTeamSeat, RoundStatus.CHOOSING_TRUMP);
        round.chooseTrump(TRUMP); // marks the current turn's team as the caller
        round.setRoundStatus(RoundStatus.FINISHED);
        return round;
    }

    private BeloteRound playingRound() {
        BeloteRound round = new BeloteRound(0, 0, RoundStatus.CHOOSING_TRUMP);
        round.chooseTrump(TRUMP);
        round.setRoundStatus(RoundStatus.PLAYING);
        return round;
    }

    private List<GamePlayer> belaPlayers() {
        return List.of(
                player("p0", 0, List.of(card(TRUMP, Rank.KING), card(TRUMP, Rank.QUEEN))),
                player("p1", 1, List.of(card(Suite.BELLS, Rank.SEVEN), card(Suite.BELLS, Rank.EIGHT))),
                player("p2", 2, List.of(card(Suite.ACORN, Rank.SEVEN), card(Suite.ACORN, Rank.EIGHT))),
                player("p3", 3, List.of(card(Suite.LEAF, Rank.SEVEN), card(Suite.LEAF, Rank.EIGHT)))
        );
    }

    private int declarationPoints(BeloteRound round, int teamIndex) {
        return round.getDeclarations(teamIndex).stream().mapToInt(Declaration::getPoints).sum();
    }

    private BeloteRound.CardThrowResult playFromHand(BeloteRound round, GamePlayer player) {
        return playFromHand(round, player, false);
    }

    private BeloteRound.CardThrowResult playFromHand(BeloteRound round, GamePlayer player, boolean declareBela) {
        Card card = player.getHand().getFirst();
        return round.throwCard(player, card, declareBela);
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
