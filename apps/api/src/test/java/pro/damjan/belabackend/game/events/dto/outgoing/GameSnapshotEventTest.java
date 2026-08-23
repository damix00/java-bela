package pro.damjan.belabackend.game.events.dto.outgoing;

import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.game.events.dto.outgoing.GameSnapshotEvent.PlayerSnapshot;
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
    void leavesIdentityNullForAPlayerCarryingNone() {
        // Lobbies already in Redis from before the change deserialize this way.
        PlayerSnapshot snapshot = PlayerSnapshot.from(new GamePlayer("u3", 1, false), "u1");

        assertThat(snapshot.getUsername()).isNull();
        assertThat(snapshot.getAvatarUrl()).isNull();
    }
}
