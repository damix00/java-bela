package pro.damjan.belabackend.matchmaking.queue;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Component;
import pro.damjan.belabackend.matchmaking.matcher.TableRecipe;
import pro.damjan.belabackend.matchmaking.ticket.MatchmakingTicket;
import pro.damjan.belabackend.matchmaking.ticket.TicketShape;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Lobbies waiting for a casual match, one sorted set per shape.
 *
 * <pre>
 * matchmaking:casual:{SOLO|PAIR|SPLIT|TRIO}   member = lobby id, score = enqueued at (millis)
 * </pre>
 *
 * A ticket is three fields and Redis carries all three structurally — the key is its shape, the
 * member its lobby, the score its wait. So nothing is serialised: no JSON, no payload key beside
 * the index, and no chance of the stored copy disagreeing with the key it sits under.
 *
 * Splitting by shape is what keeps matching cheap. A recipe can want at most four solos, two
 * pairs, two splits or one trio, so a peek reads a fixed nine entries however long the queue is,
 * and the queue itself is never scanned.
 */
@Component
@RequiredArgsConstructor
public class MatchmakingQueue {

    private static final String KEY_PREFIX = "matchmaking:casual:";

    private final StringRedisTemplate redisTemplate;

    private String bucket(TicketShape shape) {
        return KEY_PREFIX + shape.name();
    }

    /**
     * Adds a ticket, replacing any the lobby already had.
     *
     * ZADD overwrites by member, so a lobby that queues twice moves rather than duplicating. It
     * can still be left in a stale bucket if its shape changed, which is why {@link #cancel}
     * clears every bucket rather than the one it expects.
     */
    public void enqueue(MatchmakingTicket ticket) {
        cancel(ticket.lobbyId());

        redisTemplate.opsForZSet().add(
                bucket(ticket.shape()),
                ticket.lobbyId(),
                ticket.enqueuedAt().toEpochMilli());
    }

    /**
     * Removes a lobby from the queue.
     *
     * Clears all four buckets rather than looking up which one holds it. A lobby is in at most
     * one, so three of the removals do nothing, and that costs less than maintaining a reverse
     * index that could itself fall out of step. Safe to call for a lobby that was never queued.
     */
    public void cancel(String lobbyId) {
        for (TicketShape shape : TicketShape.values()) {
            redisTemplate.opsForZSet().remove(bucket(shape), lobbyId);
        }
    }

    /**
     * The oldest tickets of each shape that could still matter to a recipe.
     *
     * Bounded by {@link TableRecipe#maxNeeded}: reading further down a bucket cannot change which
     * table forms, because no recipe could use the extra tickets.
     */
    public Map<TicketShape, List<MatchmakingTicket>> peek() {
        Map<TicketShape, List<MatchmakingTicket>> heads = new EnumMap<>(TicketShape.class);

        for (TicketShape shape : TicketShape.values()) {
            int wanted = TableRecipe.maxNeeded(shape);
            if (wanted == 0) continue;

            Set<ZSetOperations.TypedTuple<String>> entries =
                    redisTemplate.opsForZSet().rangeWithScores(bucket(shape), 0, wanted - 1);

            heads.put(shape, toTickets(shape, entries));
        }

        return heads;
    }

    private List<MatchmakingTicket> toTickets(
            TicketShape shape,
            Set<ZSetOperations.TypedTuple<String>> entries
    ) {
        List<MatchmakingTicket> tickets = new ArrayList<>();
        if (entries == null) return tickets;

        for (ZSetOperations.TypedTuple<String> entry : entries) {
            if (entry.getValue() == null || entry.getScore() == null) continue;

            tickets.add(new MatchmakingTicket(
                    entry.getValue(),
                    shape,
                    Instant.ofEpochMilli(entry.getScore().longValue())));
        }

        return tickets;
    }

    /**
     * Takes tickets out of the queue for a table that is about to be seated.
     *
     * Reports whether every one was still there. Under the matchmaking lock they always should
     * be, so a false here means the lock did not hold — far better to abandon the table and try
     * again than to seat a lobby another instance has already used.
     */
    public boolean commit(Collection<MatchmakingTicket> tickets) {
        boolean allRemoved = true;

        for (MatchmakingTicket ticket : tickets) {
            Long removed = redisTemplate.opsForZSet()
                    .remove(bucket(ticket.shape()), ticket.lobbyId());

            if (removed == null || removed == 0) allRemoved = false;
        }

        return allRemoved;
    }
}
