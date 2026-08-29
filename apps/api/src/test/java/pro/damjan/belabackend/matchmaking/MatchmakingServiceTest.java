package pro.damjan.belabackend.matchmaking;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.model.LobbyPlayer;
import pro.damjan.belabackend.lobby.model.LobbyPlayerStatus;
import pro.damjan.belabackend.lobby.repository.LobbyRepository;
import pro.damjan.belabackend.matchmaking.matcher.TableMatcher;
import pro.damjan.belabackend.matchmaking.queue.MatchmakingQueue;
import pro.damjan.belabackend.matchmaking.ticket.MatchmakingTicket;
import pro.damjan.belabackend.matchmaking.ticket.TicketShape;
import pro.damjan.belabackend.redis.lock.InMemoryLockStore;
import pro.damjan.belabackend.redis.lock.ReentrantDistributedLock;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MatchmakingServiceTest {

    private MatchmakingQueue queue;
    private LobbyRepository lobbyRepository;
    private MatchedTableHandler matchedTableHandler;
    private MatchmakingService matchmakingService;

    private final Map<TicketShape, List<MatchmakingTicket>> buckets = new EnumMap<>(TicketShape.class);

    @BeforeEach
    void setUp() {
        queue = mock(MatchmakingQueue.class);
        lobbyRepository = mock(LobbyRepository.class);
        matchedTableHandler = mock(MatchedTableHandler.class);

        matchmakingService = new MatchmakingService(
                queue,
                new TableMatcher(),
                lobbyRepository,
                new ReentrantDistributedLock(new InMemoryLockStore()),
                matchedTableHandler);

        when(queue.peek()).thenReturn(buckets);
        when(queue.commit(anyCollection())).thenReturn(true);

        // Cancelling really has to remove the ticket, or a retry would keep rediscovering the
        // stale one it just dropped and the loop would never converge.
        org.mockito.Mockito.doAnswer(invocation -> {
            String lobbyId = invocation.getArgument(0);
            buckets.values().forEach(tickets ->
                    tickets.removeIf(ticket -> ticket.lobbyId().equals(lobbyId)));
            return null;
        }).when(queue).cancel(anyString());
    }

    /** A real lobby of the given size, registered with the repository and the fake queue. */
    private Lobby givenWaiting(String id, int players) {
        Lobby lobby = new Lobby();
        lobby.setId(id);

        for (int i = 0; i < players; i++) {
            lobby.addPlayer(new LobbyPlayer(id + "-p" + i, i == 0, LobbyPlayerStatus.READY));
        }

        when(lobbyRepository.findById(id)).thenReturn(Optional.of(lobby));

        TicketShape shape = TicketShape.of(lobby);
        buckets.computeIfAbsent(shape, ignored -> new ArrayList<>())
                .add(new MatchmakingTicket(id, shape, Instant.parse("2026-08-29T12:00:00Z")));

        return lobby;
    }

    @Test
    void queuesTheLobbyThatAsked() {
        Lobby lobby = new Lobby();
        lobby.setId("solo");
        lobby.addPlayer(new LobbyPlayer("p0", true, LobbyPlayerStatus.READY));

        matchmakingService.requestMatch(lobby);

        verify(queue).enqueue(any(MatchmakingTicket.class));
    }

    @Test
    void doesNotFormATableWhenNothingElseIsWaiting() {
        Lobby lobby = givenWaiting("solo", 1);

        matchmakingService.requestMatch(lobby);

        verify(matchedTableHandler, never()).onTableFormed(any());
    }

    @Test
    void formsATableAndHandsItOver() {
        givenWaiting("a", 2);
        Lobby joining = givenWaiting("b", 2);

        matchmakingService.requestMatch(joining);

        verify(matchedTableHandler).onTableFormed(any(MatchedTable.class));
    }

    @Test
    void takesTheMatchedTicketsOutOfTheQueue() {
        givenWaiting("a", 2);
        Lobby joining = givenWaiting("b", 2);

        matchmakingService.requestMatch(joining);

        verify(queue).commit(anyCollection());
    }

    @Test
    void dropsATicketWhoseLobbyDisappeared() {
        givenWaiting("a", 2);
        Lobby joining = givenWaiting("b", 2);
        when(lobbyRepository.findById("a")).thenReturn(Optional.empty());

        matchmakingService.requestMatch(joining);

        verify(queue).cancel("a");
        verify(matchedTableHandler, never()).onTableFormed(any());
    }

    @Test
    void dropsATicketWhoseLobbyChangedShape() {
        Lobby drifted = givenWaiting("a", 2);
        Lobby joining = givenWaiting("b", 2);

        // The waiting pair split up while queued, so its ticket no longer describes it.
        drifted.swapSeats("a-p1", 1);

        matchmakingService.requestMatch(joining);

        verify(queue).cancel("a");
        verify(matchedTableHandler, never()).onTableFormed(any());
    }

    @Test
    void abandonsTheTableWhenATicketIsLostWhileCommitting() {
        givenWaiting("a", 2);
        Lobby joining = givenWaiting("b", 2);
        when(queue.commit(anyCollection())).thenReturn(false);

        matchmakingService.requestMatch(joining);

        verify(matchedTableHandler, never()).onTableFormed(any());
    }

    @Test
    void cancellingRemovesTheLobbyFromTheQueue() {
        matchmakingService.cancel("lobby-id");

        verify(queue).cancel("lobby-id");
    }

    @Test
    void cancellingALobbyThatNeverQueuedIsHarmless() {
        matchmakingService.cancel("never-queued");

        verify(queue).cancel("never-queued");
        verify(matchedTableHandler, never()).onTableFormed(any());
    }

    @Test
    void theHandlerRunsOutsideTheQueueLock() {
        givenWaiting("a", 2);
        Lobby joining = givenWaiting("b", 2);

        // Re-entering matchmaking from the handler would deadlock against a lock still held.
        // It must not, because seating a table is done once the tickets are already committed.
        org.mockito.Mockito.doAnswer(invocation -> {
            matchmakingService.cancel("unrelated-lobby");
            return null;
        }).when(matchedTableHandler).onTableFormed(any());

        matchmakingService.requestMatch(joining);

        verify(queue).cancel("unrelated-lobby");
    }

    @Test
    void aLobbyIsNeverMatchedWithItself() {
        Lobby lobby = givenWaiting("alone", 2);

        matchmakingService.requestMatch(lobby);

        verify(matchedTableHandler, never()).onTableFormed(any());
        verify(queue, never()).commit(anyCollection());
    }

    @Test
    void doesNotTouchTheHandlerWhenTheQueueIsEmpty() {
        Lobby lobby = new Lobby();
        lobby.setId("solo");
        lobby.addPlayer(new LobbyPlayer("p0", true, LobbyPlayerStatus.READY));
        when(lobbyRepository.findById(anyString())).thenReturn(Optional.of(lobby));

        matchmakingService.requestMatch(lobby);

        verify(matchedTableHandler, never()).onTableFormed(any());
    }
}
