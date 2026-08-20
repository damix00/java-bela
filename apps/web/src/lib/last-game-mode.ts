/**
 * The one preference this client remembers between visits: which game mode the
 * player last chose.
 *
 * Written as an external store rather than as a value some component reads on
 * mount and copies into state. That is not ceremony — `localStorage` genuinely
 * is state living outside React, and the copy-into-state version has to set
 * state from an effect, which the React Compiler rejects and which paints the
 * default mode for one frame before correcting it. `useSyncExternalStore` is
 * built for exactly this shape: the server and the hydrating render both see
 * `null` from `getServerSnapshot`, and the stored value arrives immediately
 * after, without a mismatch.
 *
 * Deliberately not the session — the access token lives in memory and the
 * refresh token in an httpOnly cookie, and neither belongs in storage a script
 * can read. A mode id is not a credential: the worst a tampered value can do is
 * name a mode that doesn't exist, which the reader drops.
 *
 * Every `localStorage` access is wrapped, because it is a getter that *throws*
 * when storage is disabled or a Safari private window has filled its quota. The
 * in-memory mirror is what the UI actually reads, so a browser that refuses to
 * persist still gets a working selector — the choice just doesn't outlive the
 * visit, which is the failure this feature can afford.
 */
const STORAGE_KEY = "bela.lastGameMode";

const listeners = new Set<() => void>();

/** `undefined` means "not read from storage yet"; `null` means "nothing stored". */
let cached: string | null | undefined;

function readStorage(): string | null {
    try {
        return window.localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

function emit() {
    for (const listener of listeners) listener();
}

/**
 * The snapshot `useSyncExternalStore` polls. Returns a primitive, so repeated
 * calls comparing equal is all the stability it needs.
 */
export function getLastGameMode(): string | null {
    if (cached === undefined) cached = readStorage();

    return cached;
}

/** Server and hydration snapshot: no storage exists yet, so nothing is stored. */
export function getServerLastGameMode(): null {
    return null;
}

export function subscribeLastGameMode(listener: () => void): () => void {
    listeners.add(listener);

    // Another tab choosing a mode moves this one too — the preference is the
    // browser's, not the document's. A null `key` is the storage-cleared event.
    function onStorage(event: StorageEvent) {
        if (event.key !== null && event.key !== STORAGE_KEY) return;
        cached = readStorage();
        emit();
    }

    window.addEventListener("storage", onStorage);

    return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
    };
}

/** Records the choice: in memory always, on disk when the browser allows it. */
export function setLastGameMode(id: string): void {
    cached = id;

    try {
        window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
        // Storage is off or full — the mirror above still carries this visit.
    }

    emit();
}
