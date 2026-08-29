package pro.damjan.belabackend.matchmaking.matcher;

import pro.damjan.belabackend.matchmaking.ticket.TicketShape;

import java.util.Arrays;
import java.util.Collections;
import java.util.EnumMap;
import java.util.Map;

/**
 * Every combination of waiting lobbies that fills a table.
 *
 * There are six, and that is the whole reason matching costs nothing. A queued lobby holds one to
 * three players in one of four shapes, so the combinations that seat exactly two players per team
 * can be written down once rather than searched for. {@code PAIR + SPLIT} is the only grouping of
 * four players missing from this list: a pair fills a team outright, and a split needs a seat on
 * each, so the two can never share a table.
 *
 * Because the recipes are fixed, so is the number of tickets worth looking at — see
 * {@link #maxNeeded}. The queue is never scanned; only the head of each bucket is read.
 */
public enum TableRecipe {

    TRIO_AND_SOLO(Map.of(TicketShape.TRIO, 1, TicketShape.SOLO, 1)),
    TWO_PAIRS(Map.of(TicketShape.PAIR, 2)),
    TWO_SPLITS(Map.of(TicketShape.SPLIT, 2)),
    PAIR_AND_TWO_SOLOS(Map.of(TicketShape.PAIR, 1, TicketShape.SOLO, 2)),
    SPLIT_AND_TWO_SOLOS(Map.of(TicketShape.SPLIT, 1, TicketShape.SOLO, 2)),
    FOUR_SOLOS(Map.of(TicketShape.SOLO, 4));

    private final Map<TicketShape, Integer> counts;

    TableRecipe(Map<TicketShape, Integer> counts) {
        EnumMap<TicketShape, Integer> byShape = new EnumMap<>(TicketShape.class);
        byShape.putAll(counts);
        this.counts = Collections.unmodifiableMap(byShape);
    }

    /** How many tickets of a shape this recipe uses, zero if it uses none. */
    public int need(TicketShape shape) {
        return counts.getOrDefault(shape, 0);
    }

    public Map<TicketShape, Integer> counts() {
        return counts;
    }

    public boolean uses(TicketShape shape) {
        return need(shape) > 0;
    }

    /**
     * The most tickets of a shape any single recipe could want.
     *
     * This is what bounds a peek at the queue — reading more than this can never change the
     * outcome. Derived from the recipes rather than written down beside them, so the two cannot
     * drift apart.
     */
    public static int maxNeeded(TicketShape shape) {
        return Arrays.stream(values())
                .mapToInt(recipe -> recipe.need(shape))
                .max()
                .orElse(0);
    }
}
