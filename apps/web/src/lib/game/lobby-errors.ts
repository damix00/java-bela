import type { SocketError } from "@/context/socket-context";
import type { Dictionary } from "@/dictionaries";

type LobbyErrors = Dictionary["table"]["lobbyErrors"];

/**
 * Whether the backend still has a lobby presence for this player.
 *
 * Kept beside `localiseLobbyError` so the string match has one home: the table
 * screen needs this one as a predicate rather than as a sentence, because a
 * reconnect can resolve it into the snapshot it was really asking for.
 */
export function isAlreadyInLobby(error: SocketError): boolean {
    return error.message.toLowerCase().includes("already in lobby");
}

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
 * string matching.
 */
export function localiseLobbyError(
    error: SocketError,
    copy: LobbyErrors,
): string {
    const message = error.message.toLowerCase();

    if (message.includes("lobby not found")) return copy.notFound;
    if (message.includes("lobby is full")) return copy.full;
    if (message.includes("not joinable")) return copy.notJoinable;
    if (isAlreadyInLobby(error)) return copy.alreadyIn;
    if (message.includes("not the lobby host")) return copy.notHost;

    return copy.generic;
}
