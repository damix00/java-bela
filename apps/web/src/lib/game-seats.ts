import type { PlayerSnapshot, TeamSnapshot } from "@bela/protocol";

/**
 * Who sits where, worked out from the game's own data.
 *
 * Deliberately not built on `partnerSeat` from `seat-identity.ts`. That encodes
 * the *lobby's* pairing — seats 0,1 against 2,3, which is `Lobby.getTeam` — while
 * a dealt game pairs 0,2 against 1,3 via `Team.pairFrom`. The two contradict each
 * other on the backend and the comment in `seat-identity.ts` already says so.
 *
 * Rather than pick a side, nothing here assumes a pairing at all: the snapshot
 * groups players into teams and stamps each with a `seatIndex`, so "my partner"
 * is just the other member of my team. If the Java pairing is ever fixed, this
 * keeps working untouched.
 */

/** The four seats in reading order from a chair: near, left, across, right. */
export type SeatOrder = [number, number, number, number];

export type GameSeating = {
    /** The seat map, keyed by `seatIndex` — what every event's `playerIndex` means. */
    bySeat: Map<number, PlayerSnapshot>;
    /** My own seat, or -1 if I am not at this table. */
    chair: number;
    /** Which team is mine: 0 for `team1`, 1 for `team2`. -1 if I am not playing. */
    teamIndex: number;
    /** Where to draw each seat, from my chair outwards. */
    order: SeatOrder;
};

/**
 * The seats laid out from a given chair.
 *
 * `across` is handed in rather than computed, because only the team data knows
 * who it is. The sides are not interchangeable: play passes to the next-higher
 * seat (`currentTurnIndex = (currentTurnIndex + 1) % 4` in `BeloteRound`), so the
 * player who follows you has to be drawn on your right for the turn to travel
 * clockwise around the table. Taking the two remaining seats in ascending order
 * instead put your successor on the left and ran the whole game backwards.
 */
function orderFrom(near: number, across: number): SeatOrder {
    const next = (near + 1) % 4;
    const [right, left] = [next, ...[0, 1, 2, 3].filter(
        (seat) => seat !== near && seat !== across && seat !== next,
    )];

    return [near, left, across, right];
}

export function seatingFor(
    team1: TeamSnapshot,
    team2: TeamSnapshot,
    userId: string | null,
): GameSeating {
    const teams = [team1, team2];
    const bySeat = new Map<number, PlayerSnapshot>();

    for (const team of teams) {
        for (const player of team.players ?? []) {
            bySeat.set(player.seatIndex, player);
        }
    }

    const teamIndex = userId
        ? teams.findIndex((team) =>
              (team.players ?? []).some((player) => player.userId === userId),
          )
        : -1;

    const mine = teamIndex === -1 ? [] : (teams[teamIndex].players ?? []);
    const me = mine.find((player) => player.userId === userId);

    // No chair of our own — an observer, or a snapshot that arrived before auth
    // settled. Seat 0 takes the near edge and the game's own pairing puts seat 2
    // across from it, which is at least a coherent table to look at.
    if (!me) {
        return { bySeat, chair: -1, teamIndex: -1, order: orderFrom(0, 2) };
    }

    const partner = mine.find((player) => player.userId !== userId);

    return {
        bySeat,
        chair: me.seatIndex,
        teamIndex,
        order: orderFrom(me.seatIndex, partner?.seatIndex ?? (me.seatIndex + 2) % 4),
    };
}
