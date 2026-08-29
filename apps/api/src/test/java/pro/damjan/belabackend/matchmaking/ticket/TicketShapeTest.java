package pro.damjan.belabackend.matchmaking.ticket;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.matchmaking.ticket.TicketShape;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TicketShapeTest {

    private Lobby lobby;

    @BeforeEach
    void setUp() {
        lobby = new Lobby();
        lobby.setId("lobby-id");
    }

    private void seat(String userId) {
        lobby.addPlayer(new LobbyPlayer(userId, false, LobbyPlayerStatus.READY));
    }

    @Test
    void oneWaitingPlayerIsASolo() {
        seat("a");

        assertThat(TicketShape.of(lobby)).isEqualTo(TicketShape.SOLO);
    }

    @Test
    void twoPlayersInTheDefaultSeatsArePartners() {
        seat("a");
        seat("b");

        assertThat(TicketShape.of(lobby)).isEqualTo(TicketShape.PAIR);
    }

    @Test
    void twoPlayersWhoSwappedToOpposingSeatsAreSplit() {
        seat("a");
        seat("b");
        lobby.swapSeats("b", 1);

        assertThat(TicketShape.of(lobby)).isEqualTo(TicketShape.SPLIT);
    }

    @Test
    void threePlayersAreATrio() {
        seat("a");
        seat("b");
        seat("c");

        assertThat(TicketShape.of(lobby)).isEqualTo(TicketShape.TRIO);
    }

    @Test
    void anEmptyLobbyCannotQueue() {
        assertThatThrownBy(() -> TicketShape.of(lobby))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("0 players");
    }

    @Test
    void aFullLobbyCannotQueue() {
        seat("a");
        seat("b");
        seat("c");
        seat("d");

        assertThatThrownBy(() -> TicketShape.of(lobby))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("4 players");
    }

    @Test
    void everyShapeCountsItsOwnPlayers() {
        assertThat(TicketShape.SOLO.size()).isEqualTo(1);
        assertThat(TicketShape.PAIR.size()).isEqualTo(2);
        assertThat(TicketShape.SPLIT.size()).isEqualTo(2);
        assertThat(TicketShape.TRIO.size()).isEqualTo(3);
    }

    @Test
    void noShapeAsksForMoreThanATableHolds() {
        for (TicketShape shape : TicketShape.values()) {
            assertThat(shape.major()).isBetween(shape.minor(), 2);
            assertThat(shape.minor()).isGreaterThanOrEqualTo(0);
        }
    }
}
