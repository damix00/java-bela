/**
 * Who partners whom.
 *
 * Partners sit opposite: seats 0 and 2 are one team, 1 and 3 the other. This is
 * `Team.pairFrom` on the backend, and `Lobby.addPlayer` seats arrivals in the
 * order 0, 2, 1, 3 so that the second player to join partners the first.
 *
 * This used to read `seat < 2`, mirroring `Lobby.getTeam`, which pairs 0,1
 * against 2,3 and disagrees with the game the lobby is about to deal. The lobby
 * screen therefore drew your partner on your left and labelled them an opponent.
 */
export function teamOf(seat: number): 0 | 1 {
    return (seat % 2) as 0 | 1;
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
    return (seat + 2) % 4;
}

/**
 * The four seats in reading order from a given chair: near, left, across,
 * right. Everything on the table screen is positioned off this.
 *
 * The sides are not interchangeable. Play passes to the next-higher seat
 * (`currentTurnIndex = (currentTurnIndex + 1) % 4` in `BeloteRound`), so the
 * player who follows you is drawn on your right and the turn travels clockwise.
 * This matches `orderFrom` in `lib/game/seats.ts`; taking the two side seats in
 * ascending order instead, as this did, mirrored the lobby against the game and
 * swapped your opponents' sides the moment the game started.
 *
 * Callers pass a real seat — `TableScreen` falls back to 0 when you have no
 * chair of your own — so there is no negative case to handle here.
 */
export function seatsFromChair(
    chair: number,
): [number, number, number, number] {
    const near = chair;
    const across = partnerSeat(near);
    const right = (near + 1) % 4;
    const [left] = [0, 1, 2, 3].filter(
        (seat) => seat !== near && seat !== across && seat !== right,
    );

    return [near, left, across, right];
}
