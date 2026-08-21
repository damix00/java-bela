package pro.damjan.belabackend.lobby.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.game.model.config.GameConfiguration;
import pro.damjan.belabackend.game.service.BeloteGameService;
import pro.damjan.belabackend.lobby.events.LobbyEventPublisher;
import pro.damjan.belabackend.lobby.exception.PlayerNotHostException;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.lobby.repository.LobbyRepository;
import pro.damjan.belabackend.user.UserRepository;
import pro.damjan.belabackend.user.UserService;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;
import pro.damjan.belabackend.user.presence.session.SessionService;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LobbyServiceTest {

    private LobbyRepository lobbyRepository;
    private UserPresenceService userPresenceService;
    private LobbyEventPublisher lobbyEventPublisher;
    private SessionService sessionService;
    private LobbyService lobbyService;
    private Lobby lobby;

    @BeforeEach
    void setUp() {
        lobbyRepository = mock(LobbyRepository.class);
        userPresenceService = mock(UserPresenceService.class);
        lobbyEventPublisher = mock(LobbyEventPublisher.class);
        sessionService = mock(SessionService.class);
        lobbyService = new LobbyService(
                lobbyRepository,
                userPresenceService,
                lobbyEventPublisher,
                sessionService,
                mock(BeloteGameService.class),
                mock(UserService.class),
                mock(UserRepository.class)
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

    private void givenUserInLobby(String userId) {
        when(userPresenceService.getUserPresence(userId))
                .thenReturn(new UserPresence(Instant.now(), "lobby-id", null));
        when(lobbyRepository.findById("lobby-id")).thenReturn(Optional.of(lobby));
    }
}
