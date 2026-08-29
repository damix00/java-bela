package pro.damjan.belabackend.matchmaking.ticket;

import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TicketCompatibilityTest {

    private static final Instant NOW = Instant.parse("2026-08-29T12:00:00Z");

    /** A lobby holding the given shape, seated the way a real lobby would be. */
    private static Lobby lobbyOf(String id, TicketShape shape) {
        Lobby lobby = new Lobby();
        lobby.setId(id);

        int players = shape.size();
        for (int i = 0; i < players; i++) {
            lobby.addPlayer(new LobbyPlayer(id + "-p" + i, i == 0, LobbyPlayerStatus.READY));
        }

        // Two players land opposite each other by default, which is a PAIR. A SPLIT is that
        // same lobby after one of them swaps into an opposing seat.
        if (shape == TicketShape.SPLIT) lobby.swapSeats(id + "-p1", 1);

        assertThat(TicketShape.of(lobby)).isEqualTo(shape);
        return lobby;
    }

    private static MatchmakingTicket ticketOf(String id, TicketShape shape) {
        return MatchmakingTicket.forLobby(lobbyOf(id, shape), NOW);
    }

    @Test
    void aSoloFitsAlongsideAnyOtherShape() {
        for (TicketShape other : TicketShape.values()) {
            assertThat(TicketShape.SOLO.compatibleWith(other))
                    .as("SOLO with %s", other)
                    .isTrue();
            assertThat(other.compatibleWith(TicketShape.SOLO))
                    .as("%s with SOLO", other)
                    .isTrue();
        }
    }

    @Test
    void twoPairsTakeATeamEach() {
        assertThat(TicketShape.PAIR.compatibleWith(TicketShape.PAIR)).isTrue();
    }

    @Test
    void twoSplitsTakeASeatOnEachTeam() {
        assertThat(TicketShape.SPLIT.compatibleWith(TicketShape.SPLIT)).isTrue();
    }

    @Test
    void aPairLeavesNoRoomForASplit() {
        // The pair fills one team outright, and a split needs a seat on both.
        assertThat(TicketShape.PAIR.compatibleWith(TicketShape.SPLIT)).isFalse();
        assertThat(TicketShape.SPLIT.compatibleWith(TicketShape.PAIR)).isFalse();
    }

    @Test
    void aTrioLeavesRoomForNothingButASolo() {
        assertThat(TicketShape.TRIO.compatibleWith(TicketShape.PAIR)).isFalse();
        assertThat(TicketShape.TRIO.compatibleWith(TicketShape.SPLIT)).isFalse();
        assertThat(TicketShape.TRIO.compatibleWith(TicketShape.TRIO)).isFalse();
        assertThat(TicketShape.TRIO.compatibleWith(TicketShape.SOLO)).isTrue();
    }

    @Test
    void compatibilityIsSymmetric() {
        for (TicketShape a : TicketShape.values()) {
            for (TicketShape b : TicketShape.values()) {
                assertThat(a.compatibleWith(b))
                        .as("%s with %s versus the reverse", a, b)
                        .isEqualTo(b.compatibleWith(a));
            }
        }
    }

    @Test
    void everyCompatiblePairLeavesSeatsASoloCouldFill() {
        for (TicketShape a : TicketShape.values()) {
            for (TicketShape b : TicketShape.values()) {
                if (!a.compatibleWith(b)) continue;

                assertThat(a.size() + b.size())
                        .as("%s with %s overfills the table", a, b)
                        .isLessThanOrEqualTo(Lobby.MAX_PLAYERS);
            }
        }
    }

    @Test
    void aTicketIsNeverCompatibleWithItsOwnLobby() {
        Lobby lobby = lobbyOf("lobby-a", TicketShape.SOLO);
        MatchmakingTicket ticket = MatchmakingTicket.forLobby(lobby, NOW);

        assertThat(ticket.compatible(lobby)).isFalse();
        assertThat(ticket.compatible(ticket)).isFalse();
    }

    @Test
    void aTicketComparesAgainstAnotherLobbysCurrentShape() {
        MatchmakingTicket pair = ticketOf("lobby-a", TicketShape.PAIR);

        assertThat(pair.compatible(lobbyOf("lobby-b", TicketShape.PAIR))).isTrue();
        assertThat(pair.compatible(lobbyOf("lobby-b", TicketShape.SPLIT))).isFalse();
    }

    @Test
    void aLobbyThatChangedShapeIsJudgedOnWhatItIsNow() {
        MatchmakingTicket pair = ticketOf("lobby-a", TicketShape.PAIR);
        Lobby waiting = lobbyOf("lobby-b", TicketShape.PAIR);

        assertThat(pair.compatible(waiting)).isTrue();

        // The waiting pair splits up; they can no longer share a table with a pair.
        waiting.swapSeats("lobby-b-p1", 1);

        assertThat(pair.compatible(waiting)).isFalse();
    }

    @Test
    void ticketsCompareByShapeTheSameWayLobbiesDo() {
        List<String> mismatches = new ArrayList<>();

        for (TicketShape a : TicketShape.values()) {
            for (TicketShape b : TicketShape.values()) {
                MatchmakingTicket ticket = ticketOf("lobby-a", a);
                Lobby other = lobbyOf("lobby-b", b);

                if (ticket.compatible(other) != ticket.compatible(MatchmakingTicket.forLobby(other, NOW))) {
                    mismatches.add(a + " with " + b);
                }
            }
        }

        assertThat(mismatches).isEmpty();
    }
}
