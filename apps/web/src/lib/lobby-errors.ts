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
export function localiseLobbyError(
    error: SocketError,
    copy: LobbyErrors,
): string {
    const message = error.message.toLowerCase();

    if (message.includes("session is locked")) return copy.sessionLocked;
    if (message.includes("lobby not found")) return copy.notFound;
    if (message.includes("lobby is full")) return copy.full;
    if (message.includes("not joinable")) return copy.notJoinable;
    if (message.includes("already in lobby")) return copy.alreadyIn;
    if (message.includes("not the lobby host")) return copy.notHost;

    return copy.generic;
}
