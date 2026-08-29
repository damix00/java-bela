package pro.damjan.belabackend.lobby.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LobbySeatingTest {

    private Lobby lobby;

    @BeforeEach
    void setUp() {
        lobby = new Lobby();
        lobby.setId("lobby-id");
    }

    private LobbyPlayer seat(String userId) {
        LobbyPlayer player = new LobbyPlayer(userId, false, LobbyPlayerStatus.NOT_READY);
        lobby.addPlayer(player);
        return player;
    }

    @Test
    void secondPlayerPartnersTheFirst() {
        LobbyPlayer host = seat("host-id");
        LobbyPlayer guest = seat("guest-id");

        assertThat(host.getSeat()).isZero();
        assertThat(guest.getSeat()).isEqualTo(2);
    }

    @Test
    void remainingPlayersFillTheOpposingTeam() {
        seat("host-id");
        seat("guest-id");
        LobbyPlayer third = seat("third-id");
        LobbyPlayer fourth = seat("fourth-id");

        assertThat(third.getSeat()).isEqualTo(1);
        assertThat(fourth.getSeat()).isEqualTo(3);
        assertThat(lobby.isFull()).isTrue();
    }

    @Test
    void aFreedSeatIsReusedBeforeLaterSeats() {
        seat("host-id");
        LobbyPlayer guest = seat("guest-id");
        seat("third-id");

        lobby.removePlayer(guest.getUserId());
        LobbyPlayer replacement = seat("replacement-id");

        assertThat(replacement.getSeat()).isEqualTo(2);
    }

    @Test
    void aPlayerJoiningAfterASwapTakesTheSeatLeftOpen() {
        seat("host-id");
        seat("guest-id");
        lobby.swapSeats("guest-id", 1);

        LobbyPlayer third = seat("third-id");

        assertThat(third.getSeat()).isEqualTo(2);
    }
}
