package pro.damjan.belabackend.matchmaking;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.lobby.model.Lobby;
import pro.damjan.belabackend.lobby.repository.LobbyRepository;
import pro.damjan.belabackend.matchmaking.matcher.TableMatcher;
import pro.damjan.belabackend.matchmaking.queue.MatchmakingQueue;
import pro.damjan.belabackend.matchmaking.ticket.MatchmakingTicket;
import pro.damjan.belabackend.matchmaking.ticket.TicketShape;
import pro.damjan.belabackend.redis.lock.DistributedLock;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Puts waiting lobbies together into tables.
 *
 * Everything that reads and then writes the queue runs under one lock, because forming a table is
 * a decision about several tickets at once: two instances matching at the same moment could
 * otherwise each build a table around the same waiting lobby. The lock is Redis-backed, so it
 * holds across instances — which is the point, since any of them can be the one a player readies
 * against.
 *
 * The decision itself is not in here. {@link TableMatcher} is pure and holds the rules;
 * {@link MatchmakingQueue} holds the storage. This is the part that sequences them safely.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MatchmakingService {

    private static final String LOCK_KEY = "matchmaking:casual:lock";
    private static final Duration LOCK_LEASE = Duration.ofSeconds(5);
    private static final Duration LOCK_WAIT = Duration.ofSeconds(5);

    /**
     * How many times to drop stale tickets and look again before giving up for this attempt.
     *
     * Each pass discards tickets whose lobbies have changed or vanished, so it makes progress
     * rather than spinning. A bound is here only so a pathological queue cannot hold the lock.
     */
    private static final int MAX_ATTEMPTS = 4;

    private final MatchmakingQueue queue;
    private final TableMatcher matcher;
    private final LobbyRepository lobbyRepository;
    private final DistributedLock distributedLock;
    private final MatchedTableHandler matchedTableHandler;

    /**
     * Queues a lobby and seats it immediately if the queue already holds a table's worth.
     *
     * The handler is called outside the lock. Seating a table touches four lobbies, their presence
     * records and their sockets, and none of that needs the queue held — the tickets are already
     * committed by then, so no other instance can reach the same lobbies through matchmaking.
     */
    public void requestMatch(Lobby lobby) {
        MatchmakingTicket ticket = MatchmakingTicket.forLobby(lobby, Instant.now());

        Optional<MatchedTable> table = distributedLock.withLock(LOCK_KEY, LOCK_LEASE, LOCK_WAIT, () -> {
            queue.enqueue(ticket);
            return findTable();
        });

        table.ifPresent(matchedTableHandler::onTableFormed);
    }

    /** Takes a lobby out of the queue. Safe for a lobby that was never in it. */
    public void cancel(String lobbyId) {
        distributedLock.withLock(LOCK_KEY, LOCK_LEASE, LOCK_WAIT, () -> queue.cancel(lobbyId));
    }

    private Optional<MatchedTable> findTable() {
        for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            Map<TicketShape, List<MatchmakingTicket>> heads = queue.peek();

            Optional<MatchedTable> candidate = matcher.match(heads);
            if (candidate.isEmpty()) return Optional.empty();

            List<MatchmakingTicket> chosen = ticketsFor(candidate.get(), heads);
            List<MatchmakingTicket> stale = stale(chosen);

            // A lobby can change or disappear while it waits — someone leaves, a pair swaps into
            // opposing seats, the lobby expires. Dropping those and looking again is also what
            // stops dead tickets accumulating: they are cleared when they reach the head.
            if (!stale.isEmpty()) {
                stale.forEach(ticket -> queue.cancel(ticket.lobbyId()));
                continue;
            }

            if (!queue.commit(chosen)) {
                log.warn("Matchmaking lost a ticket while committing a table; retrying");
                continue;
            }

            return candidate;
        }

        log.warn("Matchmaking gave up forming a table after {} attempts", MAX_ATTEMPTS);
        return Optional.empty();
    }

    private List<MatchmakingTicket> ticketsFor(
            MatchedTable table,
            Map<TicketShape, List<MatchmakingTicket>> heads
    ) {
        List<MatchmakingTicket> chosen = new ArrayList<>();

        for (MatchedLobby seated : table.lobbies()) {
            heads.values().stream()
                    .flatMap(List::stream)
                    .filter(ticket -> ticket.lobbyId().equals(seated.lobbyId()))
                    .findFirst()
                    .ifPresent(chosen::add);
        }

        return chosen;
    }

    /** Tickets whose lobby no longer exists, or no longer looks the way the ticket says. */
    private List<MatchmakingTicket> stale(List<MatchmakingTicket> tickets) {
        List<MatchmakingTicket> stale = new ArrayList<>();

        for (MatchmakingTicket ticket : tickets) {
            Lobby lobby = lobbyRepository.findById(ticket.lobbyId()).orElse(null);

            if (lobby == null || !ticket.matches(lobby)) stale.add(ticket);
        }

        return stale;
    }
}
