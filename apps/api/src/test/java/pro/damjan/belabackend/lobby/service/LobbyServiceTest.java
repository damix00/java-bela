package pro.damjan.belabackend.lobby.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.game.model.BeloteGame;
import pro.damjan.belabackend.game.model.config.GameConfiguration;
import pro.damjan.belabackend.matchmaking.MatchmakingService;
import pro.damjan.belabackend.lobby.events.LobbyEventPublisher;
import pro.damjan.belabackend.lobby.exception.PlayerNotHostException;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.lobby.model.LobbyStatus;
import pro.damjan.belabackend.lobby.repository.LobbyRepository;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserService;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;
import pro.damjan.belabackend.user.presence.session.SessionService;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LobbyServiceTest {

    private LobbyRepository lobbyRepository;
    private UserPresenceService userPresenceService;
    private LobbyEventPublisher lobbyEventPublisher;
    private SessionService sessionService;
    private LobbyGameStarter lobbyGameStarter;
    private MatchmakingService matchmakingService;
    private UserService userService;
    private LobbyService lobbyService;
    private Lobby lobby;

    @BeforeEach
    void setUp() {
        lobbyRepository = mock(LobbyRepository.class);
        userPresenceService = mock(UserPresenceService.class);
        lobbyEventPublisher = mock(LobbyEventPublisher.class);
        sessionService = mock(SessionService.class);
        lobbyGameStarter = mock(LobbyGameStarter.class);
        matchmakingService = mock(MatchmakingService.class);
        userService = mock(UserService.class);
        lobbyService = new LobbyService(
                lobbyRepository,
                userPresenceService,
                lobbyEventPublisher,
                sessionService,
                lobbyGameStarter,
                matchmakingService,
                userService
        );

        lobby = new Lobby();
        lobby.setId("lobby-id");
        lobby.addPlayer(new LobbyPlayer("host-id", true, LobbyPlayerStatus.NOT_READY));
        lobby.addPlayer(new LobbyPlayer("guest-id", false, LobbyPlayerStatus.NOT_READY));
    }

    @Test
    void newLobbyStartsWithPrivateDefaultConfiguration() {
        Lobby createdLobby = lobbyService.createLobby("host-id", "session-id");

        assertThat(createdLobby.getGameConfiguration())
                .isEqualTo(GameConfiguration.privateGame(501));
        verify(lobbyRepository).save(createdLobby);
        verify(sessionService).lockSession("session-id");
    }

    @Test
    void hostCanUpdateConfigurationAndBroadcastIt() {
        givenUserInLobby("host-id");
        GameConfiguration configuration = GameConfiguration.privateGame(701);

        lobbyService.updateConfig("host-id", configuration);

        assertThat(lobby.getGameConfiguration()).isEqualTo(configuration);
        verify(lobbyRepository).save(lobby);
        verify(lobbyEventPublisher).configChanged(lobby);
    }

    @Test
    void nonHostCannotUpdateConfiguration() {
        givenUserInLobby("guest-id");

        assertThatThrownBy(() -> lobbyService.updateConfig(
                "guest-id", GameConfiguration.privateGame(701)))
                .isInstanceOf(PlayerNotHostException.class);

        verify(lobbyRepository, never()).save(lobby);
        verify(lobbyEventPublisher, never()).configChanged(lobby);
    }

    @Test
    void stampsTheCreatorsIdentityOntoTheirSeat() {
        givenKnownUser("host-id", "Marko", "https://cdn/marko.png");

        Lobby createdLobby = lobbyService.createLobby("host-id", "session-id");

        LobbyPlayer host = createdLobby.getPlayerSeats().get(0);
        assertThat(host.getUsername()).isEqualTo("Marko");
        assertThat(host.getAvatarUrl()).isEqualTo("https://cdn/marko.png");
    }

    @Test
    void stampsAJoinersIdentityOntoTheirSeat() {
        givenKnownUser("guest-id", "Ivana", "https://cdn/ivana.png");
        Lobby empty = new Lobby();
        empty.setId("other-lobby");

        lobbyService.joinLobby("guest-id", "session-id", empty);

        LobbyPlayer joiner = empty.findPlayerById("guest-id").orElseThrow();
        assertThat(joiner.getUsername()).isEqualTo("Ivana");
        assertThat(joiner.getAvatarUrl()).isEqualTo("https://cdn/ivana.png");
    }

    @Test
    void seatsAUserItCannotResolveRatherThanFailing() {
        // A nameless seat draws with a fallback; refusing to seat the player
        // would be a far worse answer to a lookup that came back empty.
        when(userService.getUserById("host-id")).thenReturn(null);

        Lobby createdLobby = lobbyService.createLobby("host-id", "session-id");

        LobbyPlayer host = createdLobby.getPlayerSeats().get(0);
        assertThat(host.getUserId()).isEqualTo("host-id");
        assertThat(host.getUsername()).isNull();
        assertThat(host.getAvatarUrl()).isNull();
    }

    @Test
    void namesEveryBotItFillsTheEmptySeatsWith() {
        givenGameCanBeCreated();

        lobbyService.startWithBots(lobby);

        assertThat(lobby.getPlayersAsList().stream()
                .filter(LobbyPlayer::isBot)
                .map(LobbyPlayer::getUsername)
                .toList())
                .hasSize(2)
                .doesNotContainNull()
                .doesNotHaveDuplicates();
    }

    @Test
    void namesBotsConsistentlyWithTheSeatTheyLandedIn() {
        givenGameCanBeCreated();

        lobbyService.startWithBots(lobby);

        for (LobbyPlayer player : lobby.getPlayersAsList()) {
            if (!player.isBot()) continue;

            assertThat(player.getUsername())
                    .isEqualTo(LobbyPlayer.botNameForSeat(player.getSeat()));
        }
    }

    @Test
    void returningToTheLobbyResetsItForARematchAndSnapshotsItBackToThePlayer() {
        givenLobbyInGame();

        lobbyService.returnToLobby(lobby, "host-id");

        assertThat(lobby.getStatus()).isEqualTo(LobbyStatus.IN_LOBBY);
        assertThat(lobby.getGameId()).isNull();
        assertThat(lobby.isJoinable()).isTrue();
        assertThat(lobby.getGameConfiguration()).isEqualTo(GameConfiguration.privateGame(701));
        assertThat(lobby.getActivePlayers()).noneMatch(LobbyPlayer::isBot);
        assertThat(lobby.getActivePlayers())
                .allMatch(player -> player.getStatus() == LobbyPlayerStatus.NOT_READY);
        verify(lobbyRepository).save(lobby);
        verify(userPresenceService).setUserLobby("host-id", "lobby-id");
        verify(lobbyEventPublisher).sendSnapshot(lobby, "host-id");
    }

    @Test
    void aSecondPlayerReturningDoesNotResetTheLobbyAgain() {
        givenLobbyInGame();
        lobbyService.returnToLobby(lobby, "host-id");
        lobby.findPlayerById("guest-id").orElseThrow().setStatus(LobbyPlayerStatus.READY);

        lobbyService.returnToLobby(lobby, "guest-id");

        assertThat(lobby.findPlayerById("guest-id").orElseThrow().getStatus())
                .isEqualTo(LobbyPlayerStatus.READY);
        verify(lobbyRepository).save(lobby);
        verify(userPresenceService).setUserLobby("guest-id", "lobby-id");
        verify(lobbyEventPublisher).sendSnapshot(lobby, "guest-id");
    }

    private void givenLobbyInGame() {
        lobby.setGameConfiguration(GameConfiguration.privateGame(701));
        lobby.setStatus(LobbyStatus.IN_GAME);
        lobby.setGameId("game-id");
        lobby.setJoinable(false);
        lobby.addPlayer(LobbyPlayer.createBot());
        lobby.getActivePlayers().forEach(player -> player.setStatus(LobbyPlayerStatus.READY));
    }

    private void givenKnownUser(String userId, String username, String avatarUrl) {
        User user = new User();
        user.setId(userId);
        user.setUsername(username);
        user.setAvatarUrl(avatarUrl);
        when(userService.getUserById(userId)).thenReturn(user);
    }

    private void givenGameCanBeCreated() {
        lobby.setGameConfiguration(GameConfiguration.privateGame(501));
        when(lobbyGameStarter.startFrom(any(Lobby.class)))
                .thenReturn(BeloteGame.builder().id("game-id").build());
    }

    private void givenUserInLobby(String userId) {
        when(userPresenceService.getUserPresence(userId))
                .thenReturn(new UserPresence(Instant.now(), "lobby-id", null));
        when(lobbyRepository.findById("lobby-id")).thenReturn(Optional.of(lobby));
    }
}
