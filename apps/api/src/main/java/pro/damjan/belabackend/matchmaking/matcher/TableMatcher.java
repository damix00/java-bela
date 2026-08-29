package pro.damjan.belabackend.matchmaking.matcher;

import org.springframework.stereotype.Component;
import pro.damjan.belabackend.matchmaking.MatchedLobby;
import pro.damjan.belabackend.matchmaking.MatchedTable;
import pro.damjan.belabackend.matchmaking.ticket.MatchmakingTicket;
import pro.damjan.belabackend.matchmaking.ticket.TicketShape;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Picks a table out of what is waiting.
 *
 * Pure: no Redis, no clock, no lobbies. It is handed the head of each shape's bucket and either
 * returns a table or does not, which is what makes the interesting part testable on its own.
 *
 * Cost does not grow with the queue. The recipes bound how many tickets of each shape can matter,
 * so the caller peeks at most nine and this considers at most six recipes — constant work whether
 * ten lobbies are waiting or ten thousand.
 */
@Component
public class TableMatcher {

    /** Seats per team, and so the demand a full table represents on each side. */
    private static final int SEATS_PER_TEAM = TicketShape.SEATS_PER_TEAM;

    /**
     * @param buckets waiting tickets by shape, each list oldest first
     */
    public Optional<MatchedTable> match(Map<TicketShape, List<MatchmakingTicket>> buckets) {
        Optional<MatchmakingTicket> oldest = oldestWaiting(buckets);
        if (oldest.isEmpty()) return Optional.empty();

        // Anchoring on the longest waiter is the fairness rule: every table formed contains it, so
        // no lobby can be passed over indefinitely while newer ones are seated around it.
        TicketShape anchorShape = oldest.get().shape();

        return java.util.Arrays.stream(TableRecipe.values())
                .filter(recipe -> recipe.uses(anchorShape))
                .map(recipe -> select(recipe, buckets))
                .flatMap(Optional::stream)
                // Among the recipes that work, prefer the table whose newest member has waited
                // longest, so seating one group never leaves an older one behind for no reason.
                .min(Comparator.comparing(TableMatcher::newestWait))
                .flatMap(this::seat);
    }

    private static Optional<MatchmakingTicket> oldestWaiting(Map<TicketShape, List<MatchmakingTicket>> buckets) {
        return buckets.values().stream()
                .filter(tickets -> !tickets.isEmpty())
                .map(List::getFirst)
                .min(Comparator.comparing(MatchmakingTicket::enqueuedAt));
    }

    private static Instant newestWait(List<MatchmakingTicket> table) {
        return table.stream()
                .map(MatchmakingTicket::enqueuedAt)
                .max(Comparator.naturalOrder())
                .orElse(Instant.MAX);
    }

    /** The oldest tickets of each shape the recipe calls for, or empty if the queue is short. */
    private Optional<List<MatchmakingTicket>> select(
            TableRecipe recipe,
            Map<TicketShape, List<MatchmakingTicket>> buckets
    ) {
        List<MatchmakingTicket> selected = new ArrayList<>();

        for (Map.Entry<TicketShape, Integer> entry : recipe.counts().entrySet()) {
            List<MatchmakingTicket> waiting = buckets.getOrDefault(entry.getKey(), List.of());
            if (waiting.size() < entry.getValue()) return Optional.empty();

            selected.addAll(waiting.subList(0, entry.getValue()));
        }

        return Optional.of(selected);
    }

    /**
     * Works out which side of the table each lobby takes.
     *
     * Every ticket can be turned over onto either team, so this is a search over which way up each
     * one goes — at most sixteen combinations for four tickets, and a recipe guarantees at least
     * one of them fits. Enumerating rather than reasoning is both shorter and harder to get wrong.
     */
    private Optional<MatchedTable> seat(List<MatchmakingTicket> tickets) {
        for (int flips = 0; flips < (1 << tickets.size()); flips++) {
            int teamZero = 0;
            int teamOne = 0;

            for (int i = 0; i < tickets.size(); i++) {
                TicketShape shape = tickets.get(i).shape();
                boolean flipped = (flips & (1 << i)) != 0;

                teamZero += flipped ? shape.minor() : shape.major();
                teamOne += flipped ? shape.major() : shape.minor();
            }

            if (teamZero != SEATS_PER_TEAM || teamOne != SEATS_PER_TEAM) continue;

            List<MatchedLobby> seated = new ArrayList<>();
            for (int i = 0; i < tickets.size(); i++) {
                seated.add(new MatchedLobby(tickets.get(i).lobbyId(), (flips & (1 << i)) != 0));
            }

            return Optional.of(new MatchedTable(seated));
        }

        return Optional.empty();
    }
}
