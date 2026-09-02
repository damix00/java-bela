package pro.damjan.belabackend.game.events.dto.outgoing;

import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.game.events.dto.outgoing.GameSnapshotEvent.PlayerSnapshot;
import pro.damjan.belabackend.game.events.dto.outgoing.GameSnapshotEvent.RoundSnapshot;
import pro.damjan.belabackend.game.model.card.Declaration;
import pro.damjan.belabackend.game.model.round.BeloteRound;
import pro.damjan.belabackend.game.model.round.RoundStatus;
import pro.damjan.belabackend.game.model.card.Card;
import pro.damjan.belabackend.game.model.card.Rank;
import pro.damjan.belabackend.game.model.card.Suite;
import pro.damjan.belabackend.game.model.player.GamePlayer;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class GameSnapshotEventTest {

    private static GamePlayer player(String userId, String username) {
        GamePlayer player = new GamePlayer(userId, 0, false, username, "https://cdn/" + userId + ".png");
        player.receiveCards(List.of(
                new Card(Suite.HEARTS, Rank.ACE, false),
                new Card(Suite.BELLS, Rank.KING, false)
        ));
        return player;
    }

    @Test
    void namesThePerspectivePlayer() {
        PlayerSnapshot snapshot = PlayerSnapshot.from(player("u1", "Marko"), "u1");

        assertThat(snapshot.getUsername()).isEqualTo("Marko");
        assertThat(snapshot.getAvatarUrl()).isEqualTo("https://cdn/u1.png");
    }

    @Test
    void namesEveryOtherPlayerToo() {
        // The whole point of the change: an opponent's identity travels with the
        // snapshot, so the client never has to go ask who is in the seat.
        PlayerSnapshot snapshot = PlayerSnapshot.from(player("u2", "Ivana"), "u1");

        assertThat(snapshot.getUsername()).isEqualTo("Ivana");
        assertThat(snapshot.getAvatarUrl()).isEqualTo("https://cdn/u2.png");
    }

    @Test
    void stillHidesOtherPlayersHandsWhileNamingThem() {
        PlayerSnapshot snapshot = PlayerSnapshot.from(player("u2", "Ivana"), "u1");

        assertThat(snapshot.getHand()).isNull();
        assertThat(snapshot.getCardCount()).isEqualTo(2);
    }

    @Test
    void stillRevealsThePerspectivePlayersOwnHand() {
        PlayerSnapshot snapshot = PlayerSnapshot.from(player("u1", "Marko"), "u1");

        assertThat(snapshot.getHand()).hasSize(2);
    }

    @Test
    void withholdsTheContestWhileTheTableIsStillBeingAsked() {
        BeloteRound round = roundWithZvanja(RoundStatus.DECLARING);

        RoundSnapshot snapshot = RoundSnapshot.from(round, 0, null, null);

        assertThat(snapshot.getTeam1Declarations()).isEmpty();
        assertThat(snapshot.getTeam2Declarations()).isEmpty();
        assertThat(snapshot.getDeclinedDeclarationSeats()).isEmpty();
    }

    @Test
    void namesTheContestOnceItIsRevealed() {
        BeloteRound round = roundWithZvanja(RoundStatus.DECLARATIONS);

        RoundSnapshot snapshot = RoundSnapshot.from(round, 0, null, null);

        assertThat(snapshot.getTeam1Declarations()).hasSize(1);
        assertThat(snapshot.getDeclinedDeclarationSeats()).containsExactly(1);
    }

    @Test
    void tellsEachSeatItsOwnZvanjaAndOnlyItsOwn() {
        BeloteRound round = roundWithZvanja(RoundStatus.DECLARING);

        assertThat(RoundSnapshot.from(round, 0, null, null).getMyDeclarations()).hasSize(1);
        assertThat(RoundSnapshot.from(round, 1, null, null).getMyDeclarations()).isEmpty();
        assertThat(RoundSnapshot.from(round, 2, null, null).getMyDeclarations()).isEmpty();
    }

    @Test
    void aViewerWithNoSeatIsToldOfNoZvanjaAtAll() {
        BeloteRound round = roundWithZvanja(RoundStatus.DECLARING);

        assertThat(RoundSnapshot.from(round, null, null, null).getMyDeclarations()).isEmpty();
    }

    @Test
    void onlyThePerspectiveSeatGetsItsBelaCallState() {
        BeloteRound round = roundWithZvanja(RoundStatus.PLAYING);
        round.getRoundPlayer(0).setBelaDeclared(true);

        assertThat(RoundSnapshot.from(round, 0, null, null).isMyBelaDeclared()).isTrue();
        assertThat(RoundSnapshot.from(round, 1, null, null).isMyBelaDeclared()).isFalse();
        assertThat(RoundSnapshot.from(round, null, null, null).isMyBelaDeclared()).isFalse();
    }

    private BeloteRound roundWithZvanja(RoundStatus status) {
        BeloteRound round = new BeloteRound(0, 0, status);
        round.getRoundPlayer(0).setDeclarations(List.of(new Declaration(
                Declaration.Type.FOUR_JACKS,
                0,
                List.of(
                        new Card(Suite.HEARTS, Rank.JACK, false),
                        new Card(Suite.BELLS, Rank.JACK, false),
                        new Card(Suite.ACORN, Rank.JACK, false),
                        new Card(Suite.LEAF, Rank.JACK, false)
                )
        )));
        round.answerDeclarations(1, false);
        return round;
    }

    @Test
    void leavesIdentityNullForAPlayerCarryingNone() {
        // Lobbies already in Redis from before the change deserialize this way.
        PlayerSnapshot snapshot = PlayerSnapshot.from(new GamePlayer("u3", 1, false), "u1");

        assertThat(snapshot.getUsername()).isNull();
        assertThat(snapshot.getAvatarUrl()).isNull();
    }
}
