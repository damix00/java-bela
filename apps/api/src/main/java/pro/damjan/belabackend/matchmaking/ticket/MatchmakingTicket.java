package pro.damjan.belabackend.matchmaking.ticket;

import pro.damjan.belabackend.lobby.model.Lobby;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

/**
 * A lobby waiting for opponents.
 *
 * Keyed by lobby rather than by an id of its own: a lobby can only ever be in the queue once,
 * so the lobby id is already unique, and keying on it makes cancelling idempotent — there is
 * no way to leave a second ticket behind for the same lobby.
 *
 * The roster is deliberately not copied in here. Tickets wait indefinitely, so a player can
 * leave the lobby while it queues; a roster captured at enqueue time would let the matcher
 * build a table around someone who is already gone. The lobby stays the source of truth and
 * is re-read when a match is committed.
 *
 * {@code shape} is the exception, and a deliberate one: caching it makes matching pure
 * in-memory arithmetic over the queue instead of a Redis read per candidate. Being derived,
 * it can go stale the same way a roster would, so a committing matcher must re-derive it from
 * the lobby and discard the ticket if the two no longer agree.
 */
public record MatchmakingTicket(
        String lobbyId,
        TicketShape shape,
        Instant enqueuedAt
) implements Serializable {

    public MatchmakingTicket {
        Objects.requireNonNull(lobbyId, "lobbyId must not be null");
        Objects.requireNonNull(shape, "shape must not be null");
        Objects.requireNonNull(enqueuedAt, "enqueuedAt must not be null");
    }

    /**
     * A ticket for a lobby as it stands now.
     *
     * The clock is passed in rather than read here so that queue ordering is testable.
     */
    public static MatchmakingTicket forLobby(Lobby lobby, Instant now) {
        Objects.requireNonNull(lobby, "lobby must not be null");
        return new MatchmakingTicket(lobby.getId(), TicketShape.of(lobby), now);
    }

    /** Whether the cached shape still describes the lobby it was taken from. */
    public boolean matches(Lobby lobby) {
        return lobbyId.equals(lobby.getId()) && shape == TicketShape.of(lobby);
    }

    /**
     * Whether a lobby could join this ticket at the same table.
     *
     * A lobby is never compatible with itself: two seats at one table cannot be the same four
     * players, and without this guard a matcher looping over the queue would happily pair a
     * lobby with its own ticket.
     *
     * The lobby's shape is read fresh rather than taken from a ticket, so this is safe to call
     * against a lobby that has just changed and not yet been re-queued.
     */
    public boolean compatible(Lobby lobby) {
        return !lobbyId.equals(lobby.getId())
                && shape.compatibleWith(TicketShape.of(lobby));
    }

    /** Whether two waiting lobbies could join the same table. */
    public boolean compatible(MatchmakingTicket other) {
        return !lobbyId.equals(other.lobbyId)
                && shape.compatibleWith(other.shape);
    }
}
