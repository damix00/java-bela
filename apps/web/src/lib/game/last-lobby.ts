/**
 * The invite code of the table this tab last held, so a player who comes back
 * to a seat that has been taken is put back at their own table rather than a
 * new one.
 *
 * The client has no other way to name a lobby it has lost. There is no lobby
 * REST surface and no rejoin command — the backend volunteers
 * `lobby:initialState` on reconnect when the player's presence still names a
 * lobby, and says nothing at all when it doesn't. So the code is kept here, and
 * a reconnect that brings no snapshot spends it on an ordinary
 * `lobby:join:code`, which is the same door an invited friend walks through.
 *
 * `sessionStorage`, not `localStorage`: a remembered table belongs to the tab
 * that had it. Shared across tabs, a second window would try to rejoin the
 * table the first one is sitting at — the newest connection wins, so it would
 * take the seat and leave the original window looking at
 * `session:superseded`. That is a fight this feature has no reason to start.
 *
 * Every access is wrapped, because the storage property is a getter that
 * *throws* outright when a browser is locked down or a private window has
 * filled its quota. Failing to remember costs a rejoin, which is exactly the
 * behaviour we have today — so there is nothing here worth a thrown error.
 */
const STORAGE_KEY = "bela.lastLobby";

/**
 * How long a remembered code is worth trying.
 *
 * Not tidiness. An invite code is six characters from a 36-character alphabet
 * and `generateInviteCode` only avoids collisions with codes *currently* in
 * use, so a code is free to be handed to someone else's table once the lobby
 * that held it is deleted. Minutes rather than days makes landing in a
 * stranger's lobby vanishingly unlikely, and a table left alone for longer than
 * this has nobody in it to come back to anyway.
 */
const MAX_AGE_MS = 5 * 60_000;

type Remembered = {
    code: string;
    /** When it was last seen, so age can be judged on read. */
    at: number;
};

/** Records the table this tab is at. Called on every lobby snapshot. */
export function rememberLobby(code: string): void {
    const value: Remembered = { code, at: Date.now() };

    try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
        // Storage is off or full. The next reconnect opens a new table, which
        // is what it did before any of this existed.
    }
}

/** The code worth rejoining, or null if there isn't one any more. */
export function recallLobby(): string | null {
    let raw: string | null;

    try {
        raw = window.sessionStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }

    if (!raw) return null;

    let value: Partial<Remembered>;

    try {
        value = JSON.parse(raw);
    } catch {
        return null;
    }

    // Anything a hand-edited entry could be. The worst a bad value does is name
    // a lobby that doesn't exist, which the rejoin treats as no lobby at all —
    // but there is no reason to send it.
    if (typeof value.code !== "string" || typeof value.at !== "number") {
        return null;
    }

    if (Date.now() - value.at > MAX_AGE_MS) return null;

    return value.code;
}

/** Forgets the table: the player left it, or it is gone. */
export function forgetLobby(): void {
    try {
        window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        // Nothing was stored either, then.
    }
}
