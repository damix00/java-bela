package pro.damjan.belabackend.lobby.service.lifecycle;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.game.service.lifecycle.GameEvictionService;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.lobby.model.LobbyStatus;
import pro.damjan.belabackend.lobby.repository.LobbyRepository;
import pro.damjan.belabackend.lobby.service.LobbyService;
import pro.damjan.belabackend.lobby.service.lock.LobbyLockService;
import pro.damjan.belabackend.redis.lock.DistributedLock;
import pro.damjan.belabackend.redis.lock.InMemoryLockStore;
import pro.damjan.belabackend.redis.lock.ReentrantDistributedLock;
import pro.damjan.belabackend.user.presence.UserPresenceService;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Every instance schedules this sweep, so what matters here is that only one of them runs it and
 * that the lobby is re-read before anything is deleted.
 */
class LobbyEvictionServiceTest {

    private static final String SWEEP_LOCK_KEY = "lobby:eviction:sweep";

    private LobbyRepository lobbyRepository;
    private UserPresenceService userPresenceService;
    private LobbyService lobbyService;
    private GameEvictionService gameEvictionService;
    private InMemoryLockStore lockStore;
    private DistributedLock distributedLock;
    private LobbyEvictionService evictionService;
    private Lobby lobby;

    @BeforeEach
    void setUp() {
        lobbyRepository = mock(LobbyRepository.class);
        userPresenceService = mock(UserPresenceService.class);
        lobbyService = mock(LobbyService.class);
        gameEvictionService = mock(GameEvictionService.class);

        lockStore = new InMemoryLockStore();
        distributedLock = new ReentrantDistributedLock(lockStore);

        evictionService = new LobbyEvictionService(
                lobbyRepository,
                userPresenceService,
                lobbyService,
                gameEvictionService,
                new LobbyLockService(distributedLock),
                distributedLock);

        lobby = new Lobby();
        lobby.setId("lobby-id");
        lobby.addPlayer(new LobbyPlayer("stale-id", true, LobbyPlayerStatus.NOT_READY));
    }

    @Test
    void evictsALobbyPlayerWhoHasAbandonedTheirSeat() {
        givenLobbyIsScannedAndLoadable();
        when(userPresenceService.isUserAbandoned("stale-id")).thenReturn(true);

        evictionService.evictOfflineLobbyPlayers();

        verify(lobbyService).evictPlayer("stale-id", lobby);
    }

    @Test
    void leavesAPlayerWhoIsStillPresent() {
        givenLobbyIsScannedAndLoadable();
        when(userPresenceService.isUserAbandoned("stale-id")).thenReturn(false);

        evictionService.evictOfflineLobbyPlayers();

        verify(lobbyService, never()).evictPlayer(anyString(), any(Lobby.class));
    }

    /**
     * The case the grace exists for: the player tabbed away to send the invite link. They stopped
     * answering half a minute ago, which is enough to show them offline, and nowhere near enough
     * to take their table away.
     */
    @Test
    void keepsTheSeatOfALobbyPlayerWhoIsMerelyStale() {
        givenLobbyIsScannedAndLoadable();
        when(userPresenceService.isUserStale("stale-id")).thenReturn(true);
        when(userPresenceService.isUserAbandoned("stale-id")).thenReturn(false);

        evictionService.evictOfflineLobbyPlayers();

        verify(lobbyService, never()).evictPlayer(anyString(), any(Lobby.class));
    }

    /**
     * A game in progress does not get the grace. Three other players are waiting on this one, so
     * the short question is the right one to ask.
     */
    @Test
    void evictsAStalePlayerFromAGameWithoutWaitingOutTheGrace() {
        lobby.setStatus(LobbyStatus.IN_GAME);
        lobby.setGameId("game-id");
        givenLobbyIsScannedAndLoadable();
        when(userPresenceService.isUserStale("stale-id")).thenReturn(true);
        when(userPresenceService.isUserAbandoned("stale-id")).thenReturn(false);

        evictionService.evictOfflineLobbyPlayers();

        verify(gameEvictionService).dropGame("game-id");
        verify(lobbyService).evictPlayer("stale-id", lobby);
    }

    @Test
    void doesNothingWhileAnotherInstanceIsSweeping() {
        // The whole point of the guard: a second instance ticking at the same moment must not run
        // a scan that deletes lobbies in parallel with the first.
        lockStore.tryAcquire(SWEEP_LOCK_KEY, "another-instance", Duration.ofSeconds(30));
        givenLobbyIsScannedAndLoadable();
        when(userPresenceService.isUserAbandoned("stale-id")).thenReturn(true);

        evictionService.evictOfflineLobbyPlayers();

        verify(lobbyRepository, never()).findAll();
        verify(lobbyService, never()).evictPlayer(anyString(), any(Lobby.class));
    }

    @Test
    void sweepsAgainOnceTheOtherInstanceIsDone() {
        // Declining a tick must not leave the key held, or the sweep would stop for good.
        givenLobbyIsScannedAndLoadable();
        when(userPresenceService.isUserAbandoned("stale-id")).thenReturn(true);

        evictionService.evictOfflineLobbyPlayers();

        assertThat(lockStore.isHeld(SWEEP_LOCK_KEY)).isFalse();
    }

    @Test
    void skipsALobbyThatWasDeletedBetweenTheScanAndTheLock() {
        // findAll only gives a snapshot. Acting on it without re-reading is what the per-lobby
        // lock exists to prevent.
        when(lobbyRepository.findAll()).thenReturn(List.of(lobby));
        when(lobbyRepository.findById("lobby-id")).thenReturn(Optional.empty());

        evictionService.evictOfflineLobbyPlayers();

        verify(lobbyService, never()).evictPlayer(anyString(), any(Lobby.class));
    }

    private void givenLobbyIsScannedAndLoadable() {
        when(lobbyRepository.findAll()).thenReturn(List.of(lobby));
        when(lobbyRepository.findById("lobby-id")).thenReturn(Optional.of(lobby));
    }
}
