package pro.damjan.belabackend.lobby.service.lifecycle;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import pro.damjan.belabackend.game.events.GameAbandonedEvent;
import pro.damjan.belabackend.game.events.PlayerLeftGameEvent;
import pro.damjan.belabackend.lobby.service.LobbyService;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
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

    @Test
    void anAbandonedGamePutsEveryoneElseBackAndTakesTheLeaverOut() {
        seatedIn("lobby-id", "p0", "p1", "p2", "p3");

        lobbyReturnService.handleGameAbandoned(
                new GameAbandonedEvent("p0", List.of("p0", "p1", "p2", "p3")));

        verify(lobbyService).returnToLobby("lobby-id", "p1");
        verify(lobbyService).returnToLobby("lobby-id", "p2");
        verify(lobbyService).returnToLobby("lobby-id", "p3");
        verify(lobbyService, never()).returnToLobby("lobby-id", "p0");
        verify(lobbyService).leaveAbandonedLobby("lobby-id", "p0");
    }

    @Test
    void theStayersAreHandedBackBeforeTheLeaverIsTakenOut() {
        // Reversed, the seat would be emptied on a table the client has not been given yet, and
        // then filled straight back in by the snapshot that followed.
        seatedIn("lobby-id", "p0", "p1");

        lobbyReturnService.handleGameAbandoned(new GameAbandonedEvent("p0", List.of("p0", "p1")));

        InOrder order = inOrder(lobbyService);
        order.verify(lobbyService).returnToLobby("lobby-id", "p1");
        order.verify(lobbyService).leaveAbandonedLobby("lobby-id", "p0");
    }

    @Test
    void aMatchmadeTableSendsEachPlayerBackToTheirOwnLobby() {
        // Separate lobbies were matched into one table. Returning them all to the leaver's would
        // seat them somewhere they have never been.
        seatedIn("lobby-a", "p0");
        seatedIn("lobby-b", "p1");

        lobbyReturnService.handleGameAbandoned(new GameAbandonedEvent("p0", List.of("p0", "p1")));

        verify(lobbyService).returnToLobby("lobby-b", "p1");
        verify(lobbyService).leaveAbandonedLobby("lobby-a", "p0");
    }

    @Test
    void aLeaverWithNoLobbyIsSimplyReleased() {
        when(userPresenceService.getUserPresence("p0"))
                .thenReturn(new UserPresence(Instant.now(), null, "game-id"));

        lobbyReturnService.handleGameAbandoned(new GameAbandonedEvent("p0", List.of("p0")));

        verify(userPresenceService).cleanUpUser("p0");
        verify(lobbyService, never()).leaveAbandonedLobby(anyString(), anyString());
    }

    @Test
    void aStayerWithoutPresenceIsSkippedRatherThanStrandingTheRest() {
        seatedIn("lobby-id", "p0", "p2");
        when(userPresenceService.getUserPresence("p1")).thenReturn(null);

        lobbyReturnService.handleGameAbandoned(
                new GameAbandonedEvent("p0", List.of("p0", "p1", "p2")));

        verify(lobbyService, never()).returnToLobby(anyString(), eq("p1"));
        verify(lobbyService).returnToLobby("lobby-id", "p2");
        verify(lobbyService).leaveAbandonedLobby("lobby-id", "p0");
    }

    private void seatedIn(String lobbyId, String... userIds) {
        for (String userId : userIds) {
            when(userPresenceService.getUserPresence(userId))
                    .thenReturn(new UserPresence(Instant.now(), lobbyId, "game-id"));
        }
    }
}
