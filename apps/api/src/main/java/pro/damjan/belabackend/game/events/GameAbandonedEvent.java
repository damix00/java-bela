package pro.damjan.belabackend.game.events;

import java.util.List;

/**
 * Published when a player walks out of a game that had not finished, taking it down with them.
 *
 * The game is already gone by the time this is published — {@code dropGame} cancelled its timers
 * and deleted it — so the ids travel on the event rather than being looked up again. {@code humanUserIds}
 * is every human who was at the table, the leaver included; bots have no lobby seat to put back.
 *
 * An application event for the reason {@link PlayerLeftGameEvent} documents: the lobby package
 * depends on the game package, and a direct call back would close that cycle.
 */
public record GameAbandonedEvent(String leaverId, List<String> humanUserIds) {}
