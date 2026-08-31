package pro.damjan.belabackend.lobby.service.lifecycle;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.game.service.lifecycle.GameReconnectService;
import pro.damjan.belabackend.lobby.events.LobbyEventPublisher;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.lobby.repository.LobbyRepository;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;
import pro.damjan.belabackend.user.presence.events.UserReconnectedEvent;
import pro.damjan.belabackend.user.presence.session.SessionTakeoverService;

import java.time.Instant;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LobbyReconnectServiceTest {

    private UserPresenceService userPresenceService;
    private LobbyRepository lobbyRepository;
    private SessionTakeoverService sessionTakeoverService;
    private LobbyEventPublisher lobbyEventPublisher;
    private GameReconnectService gameReconnectService;
    private LobbyReconnectService lobbyReconnectService;

    private final UserReconnectedEvent event = new UserReconnectedEvent("host-id", "new-session");
    private Lobby lobby;

    @BeforeEach
    void setUp() {
        userPresenceService = mock(UserPresenceService.class);
        lobbyRepository = mock(LobbyRepository.class);
        sessionTakeoverService = mock(SessionTakeoverService.class);
        lobbyEventPublisher = mock(LobbyEventPublisher.class);
        gameReconnectService = mock(GameReconnectService.class);
        lobbyReconnectService = new LobbyReconnectService(
                userPresenceService,
                lobbyRepository,
                sessionTakeoverService,
                lobbyEventPublisher,
                gameReconnectService
        );

        lobby = new Lobby();
        lobby.setId("lobby-id");
        lobby.addPlayer(new LobbyPlayer("host-id", true, LobbyPlayerStatus.NOT_READY));
    }

    @Test
    void aNewConnectionTakesTheTableFromWhicheverSessionHeldIt() throws InterruptedException {
        // The whole point of the change: an older window holding the seat used to make this
        // stand down, which left the player looking at a table they could not get back into.
        givenPresenceInLobby();

        lobbyReconnectService.handleReconnect(event);

        verify(sessionTakeoverService).takeOver("host-id", "new-session");
        verify(lobbyEventPublisher).sendSnapshot(lobby, "host-id");
        verify(gameReconnectService).handleReconnect(event);
    }

    @Test
    void aPlayerWithNoLobbyIsLeftAlone() throws InterruptedException {
        when(userPresenceService.getUserPresence("host-id"))
                .thenReturn(new UserPresence(Instant.now(), null, null));

        lobbyReconnectService.handleReconnect(event);

        verify(sessionTakeoverService, never()).takeOver(anyString(), anyString());
        verify(lobbyEventPublisher, never()).sendSnapshot(any(Lobby.class), anyString());
    }

    @Test
    void aLobbyThatIsGoneClearsThePresenceInsteadOfTakingTheSeat() throws InterruptedException {
        when(userPresenceService.getUserPresence("host-id"))
                .thenReturn(new UserPresence(Instant.now(), "lobby-id", null));
        when(lobbyRepository.findById("lobby-id")).thenReturn(Optional.empty());

        lobbyReconnectService.handleReconnect(event);

        verify(userPresenceService).cleanUpUser("host-id");
        verify(sessionTakeoverService, never()).takeOver(anyString(), anyString());
        verify(lobbyEventPublisher, never()).sendSnapshot(any(Lobby.class), anyString());
    }

    private void givenPresenceInLobby() {
        when(userPresenceService.getUserPresence("host-id"))
                .thenReturn(new UserPresence(Instant.now(), "lobby-id", null));
        when(lobbyRepository.findById("lobby-id")).thenReturn(Optional.of(lobby));
    }
}
