package pro.damjan.belabackend.lobby.service.lifecycle;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.config.GameConfiguration;
import pro.damjan.belabackend.game.model.player.GamePlayer;
import pro.damjan.belabackend.game.service.BeloteGameService;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.lobby.repository.LobbyRepository;
import pro.damjan.belabackend.lobby.service.LobbyGameStarter;
import pro.damjan.belabackend.matchmaking.MatchedLobby;
import pro.damjan.belabackend.matchmaking.MatchedTable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LobbyMatchServiceTest {

    private LobbyRepository lobbyRepository;
    private BeloteGameService beloteGameService;
    private LobbyGameStarter lobbyGameStarter;
    private LobbyMatchService lobbyMatchService;
    private BeloteGame game;

    @BeforeEach
    void setUp() {
        lobbyRepository = mock(LobbyRepository.class);
        beloteGameService = mock(BeloteGameService.class);
        lobbyGameStarter = mock(LobbyGameStarter.class);
        lobbyMatchService = new LobbyMatchService(lobbyRepository, beloteGameService, lobbyGameStarter);

        game = BeloteGame.builder().id("game-id").build();
        when(beloteGameService.createGame(anyList(), any(GameConfiguration.class))).thenReturn(game);
    }

    /** A lobby of {@code players} people, seated the way a real one would seat them. */
    private Lobby givenLobby(String id, int players) {
        Lobby lobby = new Lobby();
        lobby.setId(id);
        lobby.setGameConfiguration(GameConfiguration.casual());

        for (int i = 0; i < players; i++) {
            lobby.addPlayer(new LobbyPlayer(id + "-p" + i, i == 0, LobbyPlayerStatus.READY));
        }

        when(lobbyRepository.findById(id)).thenReturn(Optional.of(lobby));
        return lobby;
    }

    private List<GamePlayer> seatedPlayers() {
        ArgumentCaptor<List<GamePlayer>> captor = ArgumentCaptor.captor();
        verify(beloteGameService).createGame(captor.capture(), any(GameConfiguration.class));
        return captor.getValue();
    }

    /** Which team a user ended up on: seats 0 and 2 are team 0, seats 1 and 3 team 1. */
    private int teamOf(List<GamePlayer> seated, String userId) {
        GamePlayer player = seated.stream()
                .filter(p -> p.getUserId().equals(userId))
                .findFirst()
                .orElseThrow();

        return player.getSeatIndex() % 2;
    }

    @Test
    void seatsFourPlayersOneToEachSeat() {
        givenLobby("a", 2);
        givenLobby("b", 2);

        lobbyMatchService.onTableFormed(new MatchedTable(List.of(
                new MatchedLobby("a", false), new MatchedLobby("b", true))));

        List<GamePlayer> seated = seatedPlayers();
        assertThat(seated).hasSize(4);
        assertThat(seated.stream().map(GamePlayer::getSeatIndex))
                .containsExactlyInAnyOrder(0, 1, 2, 3);
    }

    @Test
    void aQueuedPairStaysOnTheSameTeam() {
        givenLobby("a", 2);
        givenLobby("b", 2);

        lobbyMatchService.onTableFormed(new MatchedTable(List.of(
                new MatchedLobby("a", false), new MatchedLobby("b", true))));

        List<GamePlayer> seated = seatedPlayers();
        assertThat(teamOf(seated, "a-p0")).isEqualTo(teamOf(seated, "a-p1"));
        assertThat(teamOf(seated, "b-p0")).isEqualTo(teamOf(seated, "b-p1"));
    }

    @Test
    void twoPairsAreOpposedToEachOther() {
        givenLobby("a", 2);
        givenLobby("b", 2);

        lobbyMatchService.onTableFormed(new MatchedTable(List.of(
                new MatchedLobby("a", false), new MatchedLobby("b", true))));

        List<GamePlayer> seated = seatedPlayers();
        assertThat(teamOf(seated, "a-p0")).isNotEqualTo(teamOf(seated, "b-p0"));
    }

    @Test
    void aLobbyThatChoseOpposingSeatsStaysOpposed() {
        Lobby split = givenLobby("a", 2);
        split.swapSeats("a-p1", 1);
        givenLobby("b", 2);
        Lobby otherSplit = lobbyRepository.findById("b").orElseThrow();
        otherSplit.swapSeats("b-p1", 1);

        lobbyMatchService.onTableFormed(new MatchedTable(List.of(
                new MatchedLobby("a", false), new MatchedLobby("b", false))));

        List<GamePlayer> seated = seatedPlayers();
        assertThat(teamOf(seated, "a-p0")).isNotEqualTo(teamOf(seated, "a-p1"));
        assertThat(teamOf(seated, "b-p0")).isNotEqualTo(teamOf(seated, "b-p1"));
    }

    @Test
    void aTrioKeepsItsPairTogetherAndItsThirdOpposed() {
        givenLobby("a", 3);
        givenLobby("b", 1);

        lobbyMatchService.onTableFormed(new MatchedTable(List.of(
                new MatchedLobby("a", false), new MatchedLobby("b", true))));

        List<GamePlayer> seated = seatedPlayers();
        // Seats fill 0, 2, 1 — so p0 and p1 are partners and p2 is against them.
        assertThat(teamOf(seated, "a-p0")).isEqualTo(teamOf(seated, "a-p1"));
        assertThat(teamOf(seated, "a-p2")).isNotEqualTo(teamOf(seated, "a-p0"));
        // The lone stranger partners the trio's odd one out.
        assertThat(teamOf(seated, "b-p0")).isEqualTo(teamOf(seated, "a-p2"));
    }

    @Test
    void fourSoloLobbiesEachTakeASeat() {
        for (String id : List.of("a", "b", "c", "d")) givenLobby(id, 1);

        lobbyMatchService.onTableFormed(new MatchedTable(List.of(
                new MatchedLobby("a", false), new MatchedLobby("b", false),
                new MatchedLobby("c", true), new MatchedLobby("d", true))));

        List<GamePlayer> seated = seatedPlayers();
        assertThat(seated).hasSize(4);
        assertThat(teamOf(seated, "a-p0")).isEqualTo(teamOf(seated, "b-p0"));
        assertThat(teamOf(seated, "c-p0")).isEqualTo(teamOf(seated, "d-p0"));
        assertThat(teamOf(seated, "a-p0")).isNotEqualTo(teamOf(seated, "c-p0"));
    }

    @Test
    void everyMatchedLobbyIsPointedAtTheSameGame() {
        Lobby a = givenLobby("a", 2);
        Lobby b = givenLobby("b", 2);

        lobbyMatchService.onTableFormed(new MatchedTable(List.of(
                new MatchedLobby("a", false), new MatchedLobby("b", true))));

        verify(lobbyGameStarter).attachToGame(a, game);
        verify(lobbyGameStarter).attachToGame(b, game);
    }

    @Test
    void theLobbiesAreNotMergedOrDeleted() {
        Lobby a = givenLobby("a", 2);
        Lobby b = givenLobby("b", 2);

        lobbyMatchService.onTableFormed(new MatchedTable(List.of(
                new MatchedLobby("a", false), new MatchedLobby("b", true))));

        // Each keeps its own players, so the game ending returns everyone where they queued from.
        assertThat(a.getPlayerCount()).isEqualTo(2);
        assertThat(b.getPlayerCount()).isEqualTo(2);
        verify(lobbyRepository, never()).delete(any(Lobby.class));
    }

    @Test
    void abandonsTheTableIfALobbyVanished() {
        givenLobby("a", 2);
        when(lobbyRepository.findById("b")).thenReturn(Optional.empty());

        lobbyMatchService.onTableFormed(new MatchedTable(List.of(
                new MatchedLobby("a", false), new MatchedLobby("b", true))));

        verify(beloteGameService, never()).createGame(anyList(), any(GameConfiguration.class));
        verify(lobbyGameStarter, never()).attachToGame(any(Lobby.class), any(BeloteGame.class));
    }
}
