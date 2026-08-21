/**
 * The numbers next to the player that nothing real produces yet.
 *
 * What used to be here — a whole table of invented opponents — is gone: the
 * seats come off the lobby socket now, so a mock player would be a fiction
 * sitting next to a real one. What is left is the rating band in the top bar,
 * which has no backend behind it at all, and the three cards fanned on an empty
 * table, which are decoration rather than a claim about anybody.
 *
 * Same job as `pages/auth/placeholders.ts`, one screen over. Delete each half
 * as the thing behind it arrives.
 */

/** The signed-in player's own numbers, as the top bar's rank meter shows them. */
export const mockTable = {
    rating: "1482",
    band: "Terca III",
    rank: "#214",
} as const;

/** The three cards fanned face-up in the middle of the empty table. */
export const mockFan = [
    { suit: "♠", red: false },
    { suit: "♥", red: true },
    { suit: "♣", red: false },
] as const;
