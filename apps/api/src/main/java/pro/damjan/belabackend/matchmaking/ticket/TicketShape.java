package pro.damjan.belabackend.matchmaking.ticket;

import pro.damjan.belabackend.lobby.model.Lobby;

/**
 * How many seats a waiting lobby needs on each team, larger side first.
 *
 * A queued lobby holds one, two, or three players — a full one starts its own game without
 * ever queueing — and partners sit opposite, so these four are the only shapes that exist.
 * Naming them keeps a nonsense demand like (3,2) unrepresentable and lets the matcher switch
 * exhaustively instead of juggling loose ints.
 *
 * Which side is "larger" is not a claim about which team: every ticket can be flipped onto
 * either team, and the matcher decides which way round when it forms a table.
 */
public enum TicketShape {

    /** One player, either team. */
    SOLO(1, 0),

    /** Two players who queued as partners. */
    PAIR(2, 0),

    /** Two players who chose to sit against each other. */
    SPLIT(1, 1),

    /** Three players: a partnered pair, plus one who takes a stranger as partner. */
    TRIO(2, 1);

    private final int major;
    private final int minor;

    TicketShape(int major, int minor) {
        this.major = major;
        this.minor = minor;
    }

    /** Seats needed on the busier of the lobby's two teams. */
    public int major() {
        return major;
    }

    /** Seats needed on the other team. Zero when everyone queued as one team. */
    public int minor() {
        return minor;
    }

    /** Total players the ticket brings to a table. */
    public int size() {
        return major + minor;
    }

    /** Seats one team has to fill. */
    public static final int SEATS_PER_TEAM = Lobby.MAX_PLAYERS / 2;

    /**
     * Whether two waiting lobbies could ever sit at the same table.
     *
     * A ticket can be flipped onto either team, so the pair fits if *some* orientation keeps
     * both teams within their seats. Only one of the two needs flipping: compatibility depends
     * on how the shapes sit relative to each other, so turning both over changes nothing.
     *
     * This yields a rule worth stating plainly. A PAIR fills one team by itself, so it can only
     * ever be joined by another PAIR or by SOLOs — a SPLIT needs a seat on each team and there
     * is no longer one free on both. A TRIO leaves a single seat, so only a SOLO completes it.
     *
     * Being pairwise, this answers "is there any table with both of these on it", not "is there
     * one in the queue right now" — the leftover seats still have to be filled by other waiting
     * tickets, which is the matcher's job. It holds as a necessary and sufficient pairwise test
     * only because SOLOs can fill any remainder, so no other combination is ruled out later.
     */
    public boolean compatibleWith(TicketShape other) {
        return fitsTogether(other.major, other.minor)
                || fitsTogether(other.minor, other.major);
    }

    private boolean fitsTogether(int otherMajor, int otherMinor) {
        return major + otherMajor <= SEATS_PER_TEAM
                && minor + otherMinor <= SEATS_PER_TEAM;
    }

    /**
     * Reads a lobby's shape off the seats its players currently occupy.
     *
     * Teams are seats 0 and 2 against 1 and 3, matching {@code Team.pairFrom}, so the parity
     * of a seat index is the team. Because a ticket is flippable, only the two counts matter
     * and not which is which — they are sorted before being matched to a shape.
     *
     * @throws IllegalArgumentException if the lobby is empty or already full, neither of
     *         which can queue.
     */
    public static TicketShape of(Lobby lobby) {
        int even = 0;
        int odd = 0;

        for (int seat : lobby.getPlayerSeats().keySet()) {
            if (seat % 2 == 0) even++;
            else odd++;
        }

        int larger = Math.max(even, odd);
        int smaller = Math.min(even, odd);

        for (TicketShape shape : values()) {
            if (shape.major == larger && shape.minor == smaller) return shape;
        }

        throw new IllegalArgumentException(
                "Lobby " + lobby.getId() + " cannot queue with " + (even + odd) + " players");
    }

    /**
     * Which of a lobby's two seat parities holds its larger group.
     *
     * A matched table says only whether a lobby's larger group is flipped onto the other team;
     * turning that into seats needs to know which group was the larger one, and a shape has
     * deliberately forgotten. Recomputing it here keeps matchmaking free of seats while still
     * letting both sides agree.
     *
     * Ties — a SPLIT, or the two parities of a SOLO — resolve to 0. Which one is picked does not
     * matter, only that the answer is the same every time it is asked.
     */
    public static int majorParity(Lobby lobby) {
        int even = 0;
        int odd = 0;

        for (int seat : lobby.getPlayerSeats().keySet()) {
            if (seat % 2 == 0) even++;
            else odd++;
        }

        return odd > even ? 1 : 0;
    }
}
