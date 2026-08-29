package pro.damjan.belabackend.matchmaking.ticket;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.matchmaking.ticket.MatchmakingTicket;
import pro.damjan.belabackend.matchmaking.ticket.TicketShape;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MatchmakingTicketTest {

    private static final Instant NOW = Instant.parse("2026-08-29T12:00:00Z");

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
    void aTicketIsKeyedByItsLobbyAndCarriesTheLobbysShape() {
        seat("a");
        seat("b");

        MatchmakingTicket ticket = MatchmakingTicket.forLobby(lobby, NOW);

        assertThat(ticket.lobbyId()).isEqualTo("lobby-id");
        assertThat(ticket.shape()).isEqualTo(TicketShape.PAIR);
        assertThat(ticket.enqueuedAt()).isEqualTo(NOW);
    }

    @Test
    void twoTicketsForTheSameLobbyAtTheSameMomentAreEqual() {
        seat("a");

        assertThat(MatchmakingTicket.forLobby(lobby, NOW))
                .isEqualTo(MatchmakingTicket.forLobby(lobby, NOW));
    }

    @Test
    void aTicketStillMatchesTheLobbyItWasTakenFrom() {
        seat("a");
        seat("b");

        assertThat(MatchmakingTicket.forLobby(lobby, NOW).matches(lobby)).isTrue();
    }

    @Test
    void aTicketStopsMatchingWhenSomeoneLeavesTheLobby() {
        seat("a");
        seat("b");
        MatchmakingTicket ticket = MatchmakingTicket.forLobby(lobby, NOW);

        lobby.removePlayer("b");

        assertThat(ticket.matches(lobby)).isFalse();
    }

    @Test
    void aTicketStopsMatchingWhenThePairSwapsIntoOpposingSeats() {
        seat("a");
        seat("b");
        MatchmakingTicket ticket = MatchmakingTicket.forLobby(lobby, NOW);

        lobby.swapSeats("b", 1);

        assertThat(ticket.shape()).isEqualTo(TicketShape.PAIR);
        assertThat(ticket.matches(lobby)).isFalse();
    }

    @Test
    void aTicketDoesNotMatchADifferentLobby() {
        seat("a");
        MatchmakingTicket ticket = MatchmakingTicket.forLobby(lobby, NOW);

        Lobby other = new Lobby();
        other.setId("other-lobby-id");
        other.addPlayer(new LobbyPlayer("c", false, LobbyPlayerStatus.READY));

        assertThat(ticket.matches(other)).isFalse();
    }

    @Test
    void aTicketRefusesMissingFields() {
        assertThatThrownBy(() -> new MatchmakingTicket(null, TicketShape.SOLO, NOW))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("lobbyId");

        assertThatThrownBy(() -> new MatchmakingTicket("lobby-id", null, NOW))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("shape");

        assertThatThrownBy(() -> new MatchmakingTicket("lobby-id", TicketShape.SOLO, null))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("enqueuedAt");
    }
}
