package pro.damjan.belabackend.lobby.service.lifecycle;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.game.events.PlayerLeftGameEvent;
import pro.damjan.belabackend.lobby.service.LobbyService;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * This listener resolves a lobby id and hands off. Loading the lobby, and coping with one that
 * has since been deleted, belong to {@code LobbyService.returnToLobby} now — it does both under
 * the lobby's lock — and are covered in {@code LobbyServiceTest}.
 */
class LobbyReturnServiceTest {

    private UserPresenceService userPresenceService;
    private LobbyService lobbyService;
    private LobbyReturnService lobbyReturnService;

    @BeforeEach
    void setUp() {
        userPresenceService = mock(UserPresenceService.class);
        lobbyService = mock(LobbyService.class);
        lobbyReturnService = new LobbyReturnService(userPresenceService, lobbyService);
    }

    @Test
    void aPlayerLeavingAGameIsTakenBackToTheirLobby() {
        when(userPresenceService.getUserPresence("user-id"))
                .thenReturn(new UserPresence(Instant.now(), "lobby-id", "game-id"));

        lobbyReturnService.handlePlayerLeftGame(new PlayerLeftGameEvent("user-id"));

        verify(lobbyService).returnToLobby("lobby-id", "user-id");
    }

    @Test
    void aPlayerWithoutPresenceIsIgnored() {
        when(userPresenceService.getUserPresence("user-id")).thenReturn(null);

        lobbyReturnService.handlePlayerLeftGame(new PlayerLeftGameEvent("user-id"));

        verify(lobbyService, never()).returnToLobby(anyString(), anyString());
    }

    @Test
    void aPlayerWhoIsNotInALobbyIsIgnored() {
        when(userPresenceService.getUserPresence("user-id"))
                .thenReturn(new UserPresence(Instant.now(), null, "game-id"));

        lobbyReturnService.handlePlayerLeftGame(new PlayerLeftGameEvent("user-id"));

        verify(lobbyService, never()).returnToLobby(anyString(), anyString());
    }
}
