/**
 * Who partners whom.
 *
 * Seats 0 and 1 are one team, 2 and 3 the other — this is `Lobby.getTeam` on
 * the backend, and the lobby is what the lobby screen is showing.
 *
 * Be aware the game model disagrees: `Team.pairFrom` pairs 0,2 against 1,3. If
 * the partner named here ever contradicts the partner a started game deals to,
 * that mismatch is the reason, and it wants fixing in Java rather than papering
 * over here.
 */
export function teamOf(seat: number): 0 | 1 {
    return seat < 2 ? 0 : 1;
}

/**
 * The other seat on your team.
 *
 * Used to lay the table out from the reader's chair: partner across, opponents
 * to either side, you at the near edge — which is where they all are in a real
 * game, and the only arrangement that lets someone glance at the screen and
 * know who they are playing with.
 */
export function partnerSeat(seat: number): number {
    return seat < 2 ? 1 - seat : 5 - seat;
}

/**
 * The four seats in reading order from a given chair: near, left, across,
 * right. Everything on the table screen is positioned off this.
 *
 * With no chair of your own — the idle screen, before a lobby exists — it falls
 * back to seat order, so seat 0 sits at the near edge.
 */
export function seatsFromChair(
    chair: number,
): [number, number, number, number] {
    const near = chair;
    const across = partnerSeat(near);
    // The opposing pair, in seat order, taking the sides.
    const [left, right] = [0, 1, 2, 3].filter(
        (seat) => seat !== near && seat !== across,
    );

    return [near, left, across, right];
}
