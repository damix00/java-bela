import type { SocketError } from "@/context/socket-context";
import type { Dictionary } from "@/dictionaries";

type LobbyErrors = Dictionary["table"]["lobbyErrors"];

/**
 * A backend refusal, in the reader's language.
 *
 * The socket answers a failed command with `{"event": "error:<command>",
 * "message", "status"}` and no machine-readable code — `ExceptionResponse`
 * carries an English sentence and an HTTP status, and that is all
 * `WebSocketEventRegistry` has to forward. So the sentences are matched here,
 * exactly as `localiseAuthError` matches the REST ones, and anything
 * unrecognised falls back to a generic line rather than showing untranslated
 * server text.
 *
 * If the backend ever grows codes for these, match on those and delete the
 * string matching. `SessionLockException` is the one worth its own sentence
 * whatever happens: it is what a second window gets, it is the failure people
 * will actually hit, and "session is locked" explains nothing to the person
 * looking at two tabs.
 */
/**
 * Whether the refusal is the session lock — the same sentence the backend
 * sends a second window. Kept beside `localiseLobbyError` so the string match
 * has one home; the table screen needs it as a predicate (to raise the modal
 * and to poll) rather than as a sentence.
 */
export function isSessionLocked(error: SocketError): boolean {
    return error.message.toLowerCase().includes("session is locked");
}

/** Whether the backend still has a lobby presence for this player. */
export function isAlreadyInLobby(error: SocketError): boolean {
    return error.message.toLowerCase().includes("already in lobby");
}

export function localiseLobbyError(
    error: SocketError,
    copy: LobbyErrors,
): string {
    const message = error.message.toLowerCase();

    if (message.includes("session is locked")) return copy.sessionLocked;
    if (message.includes("lobby not found")) return copy.notFound;
    if (message.includes("lobby is full")) return copy.full;
    if (message.includes("not joinable")) return copy.notJoinable;
    if (isAlreadyInLobby(error)) return copy.alreadyIn;
    if (message.includes("not the lobby host")) return copy.notHost;

    return copy.generic;
}
