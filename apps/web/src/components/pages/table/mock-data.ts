/**
 * Everyone at the table, and the numbers next to them.
 *
 * None of this is real and none of it is meant to be: the table screen is a
 * mockup standing in for a surface the lobby WebSocket hasn't built yet, and
 * this is the one file to delete when it does. Same job as
 * `pages/auth/placeholders.ts`, one screen over.
 *
 * The names are the ones the auth screens already invent — `marko.z` signs in
 * on the sign-in screen and sits down here at the same rating, so the two mocks
 * read as one player rather than two unrelated fictions.
 */

/** Fill for a suit badge. Chosen per player so a table isn't four of one tile. */
export type BadgeTone = "rust" | "forest" | "ink" | "muted";

export type MockPlayer = {
    name: string;
    suit: string;
    tone: BadgeTone;
};

export const mockTable = {
    /** The signed-in player's own numbers, as the top bar's rank meter shows them. */
    rating: "1482",
    band: "Terca III",
    rank: "#214",

    partner: {
        name: "ivan.bela",
        rating: "1533",
        suit: "♥",
        tone: "rust",
    } satisfies MockPlayer & { rating: string },

    you: {
        name: "marko.z",
        rating: "1482",
        suit: "♥",
        tone: "rust",
    } satisfies MockPlayer & { rating: string },
} as const;

/** The three cards fanned face-up in the middle of the empty table. */
export const mockFan = [
    { suit: "♠", red: false },
    { suit: "♥", red: true },
    { suit: "♣", red: false },
] as const;
