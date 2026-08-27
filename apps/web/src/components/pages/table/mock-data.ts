/**
 * What the table draws that nothing real produces yet.
 *
 * What used to be here is nearly all gone. The invented opponents went when the
 * seats started coming off the lobby socket — a mock player would be a fiction
 * sitting next to a real one — and the top bar's rating band went with them,
 * because a number that precise is the one thing a card player will believe on
 * sight. The meter says "unrated" now.
 *
 * What is left is decoration rather than a claim about anybody.
 *
 * Same job as `pages/auth/placeholders.ts`, one screen over. Delete each piece
 * as the thing behind it arrives.
 */

/** The three cards fanned face-up in the middle of the empty table. */
export const mockFan = [
    { suit: "♠", red: false },
    { suit: "♥", red: true },
    { suit: "♣", red: false },
] as const;
