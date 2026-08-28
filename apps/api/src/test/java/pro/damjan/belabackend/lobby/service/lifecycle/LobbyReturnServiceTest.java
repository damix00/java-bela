package pro.damjan.belabackend.lobby.service.lifecycle;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.game.events.PlayerLeftGameEvent;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.repository.LobbyRepository;
import pro.damjan.belabackend.lobby.service.LobbyService;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;

import java.time.Instant;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LobbyReturnServiceTest {

    private UserPresenceService userPresenceService;
    private LobbyRepository lobbyRepository;
    private LobbyService lobbyService;
    private LobbyReturnService lobbyReturnService;
    private Lobby lobby;

    @BeforeEach
    void setUp() {
        userPresenceService = mock(UserPresenceService.class);
        lobbyRepository = mock(LobbyRepository.class);
        lobbyService = mock(LobbyService.class);
        lobbyReturnService = new LobbyReturnService(userPresenceService, lobbyRepository, lobbyService);

        lobby = new Lobby();
        lobby.setId("lobby-id");
    }

    @Test
    void aPlayerLeavingAGameIsTakenBackToTheirLobby() {
        when(userPresenceService.getUserPresence("user-id"))
                .thenReturn(new UserPresence(Instant.now(), "lobby-id", "game-id"));
        when(lobbyRepository.findById("lobby-id")).thenReturn(Optional.of(lobby));

        lobbyReturnService.handlePlayerLeftGame(new PlayerLeftGameEvent("user-id"));

        verify(lobbyService).returnToLobby(lobby, "user-id");
    }

    @Test
    void aPlayerWithoutPresenceIsIgnored() {
        when(userPresenceService.getUserPresence("user-id")).thenReturn(null);

        lobbyReturnService.handlePlayerLeftGame(new PlayerLeftGameEvent("user-id"));

        verify(lobbyService, never()).returnToLobby(any(Lobby.class), anyString());
    }

    @Test
    void aPlayerWhoIsNotInALobbyIsIgnored() {
        when(userPresenceService.getUserPresence("user-id"))
                .thenReturn(new UserPresence(Instant.now(), null, "game-id"));

        lobbyReturnService.handlePlayerLeftGame(new PlayerLeftGameEvent("user-id"));

        verify(lobbyRepository, never()).findById(anyString());
        verify(lobbyService, never()).returnToLobby(any(Lobby.class), anyString());
    }

    @Test
    void aPlayerWhoseLobbyIsGoneHasTheirPresenceCleanedUp() {
        when(userPresenceService.getUserPresence("user-id"))
                .thenReturn(new UserPresence(Instant.now(), "lobby-id", "game-id"));
        when(lobbyRepository.findById("lobby-id")).thenReturn(Optional.empty());

        lobbyReturnService.handlePlayerLeftGame(new PlayerLeftGameEvent("user-id"));

        verify(userPresenceService).cleanUpUser("user-id");
        verify(lobbyService, never()).returnToLobby(any(Lobby.class), anyString());
    }
}
