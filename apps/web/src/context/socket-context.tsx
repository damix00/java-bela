"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import type {
    ClientEventName,
    ClientEvents,
    ServerEventName,
    ServerEvents,
} from "@bela/protocol";

import {
    ensureFreshToken,
    getAuthSnapshot,
    subscribeAuth,
} from "@/api/token-store";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";

/**
 * The code the backend closes with when it could not authenticate the
 * handshake. It closes rather than refusing because a browser cannot read a
 * failed handshake's HTTP status — `onclose` reports 1006, which is
 * indistinguishable from "the server is down". See `WebSocketAuthInterceptor`.
 */
const CLOSE_UNAUTHORIZED = 4401;

/**
 * How often to send `session:keepAlive`.
 *
 * Not a round number picked for tidiness. The backend's `UserSession` holds a
 * 30s Redis TTL and `UserPresence.STALE_TTL` is also 30s, while
 * `LobbyEvictionService` sweeps every 10s and throws stale players out of their
 * lobby. Five seconds leaves room for several missed pings before any of that
 * fires.
 */
const KEEPALIVE_MS = 15_000;

/**
 * How long a tab may sit in the background before its socket is treated as
 * dead on return, whatever `readyState` claims.
 *
 * Background tabs have their timers throttled — Safari is the strictest about
 * it, but every browser does some of this — so the keepalive above stops
 * landing within seconds of the tab being hidden. Once it lapses the backend's
 * 30s `UserSession` TTL runs out, the session is dropped and
 * `LobbyEvictionService` takes the seat back. The socket is then finished even
 * though Safari commonly reports it `OPEN` until the tab is looked at again,
 * and never fires `onclose` while suspended. So the hidden duration, not the
 * readyState, is what decides: 20s is inside the 30s TTL, which keeps a quick
 * glance at another tab from costing a reconnect.
 */
const STALE_HIDDEN_MS = 20_000;

export type SocketStatus =
    | "connecting"
    | "connected"
    | "disconnected"
    /** Terminal. The session is over, so reconnecting cannot help. */
    | "auth-failed"
    /**
     * Terminal, and terminal on purpose. The player opened the game somewhere
     * else and that window now holds their seat. Reconnecting *would* work —
     * the newest connection always wins — which is exactly why this one does
     * not: two windows both taking the seat back would pass it between them
     * forever.
     */
    | "superseded";

/**
 * A backend failure, delivered as `{"event": "error:<command>", ...}`.
 *
 * These frames are deliberately outside `ServerEvents`: the name is built from
 * whichever command failed (`WebSocketEventRegistry` concatenates it), so the
 * set isn't enumerable from the protocol package. `command` here is that
 * original event name with the prefix stripped.
 */
export type SocketError = {
    command: string;
    message: string;
    status: number;
};

type Handler = (data: never) => void;

/**
 * The socket's verbs. Every one of these is stable for the life of the
 * provider — they close over refs, never over state.
 */
type SocketCommands = {
    /** Start a fresh socket session immediately, without waiting for backoff. */
    reconnect: () => void;
    send: <K extends ClientEventName>(
        event: K,
        ...body: ClientEvents[K] extends null ? [] : [ClientEvents[K]]
    ) => void;
    subscribe: <K extends ServerEventName>(
        event: K,
        handler: (data: ServerEvents[K]) => void,
    ) => () => void;
    /** Every `error:*` frame, on one channel. */
    subscribeErrors: (handler: (error: SocketError) => void) => () => void;
};

/**
 * The status and the commands are two contexts, not one object, because they
 * change on completely different clocks.
 *
 * `status` flips on every reconnect — and a backoff cycle can flip it several
 * times a minute — while the commands never change at all. Behind one context
 * that distinction is lost: the value object is rebuilt on each flip, so
 * everything holding it re-renders, including `LobbyProvider`, which only ever
 * wanted `send`. That re-render rebuilds the lobby's own value and the whole
 * table follows it down. Splitting them means a reconnect touches exactly the
 * two components that draw the connection state.
 */
const SocketCommandsContext = createContext<SocketCommands | undefined>(
    undefined,
);

const SocketStatusContext = createContext<SocketStatus | undefined>(undefined);

/**
 * When the socket session currently in hand opened, as a timestamp. 0 before
 * the first one does.
 *
 * A third context, and for the same reason as the split above: this changes
 * only on a *successful* open, so the providers that have to reconsider what
 * they know each time the line is remade are not also dragged through every
 * step of a backoff.
 *
 * A timestamp rather than a counter because it is read as one: a consumer
 * comparing it against the last frame it received can tell whether that frame
 * belongs to this session or to the one before it, and does so without
 * depending on which of the two React renders first.
 */
const SocketSessionContext = createContext<number | undefined>(undefined);

/** The channel `error:*` frames are fanned out to. Not a real server event. */
const ERROR_CHANNEL = "\0error";

/**
 * One WebSocket for the signed-in shell, and the only route to the lobby —
 * which has no REST surface whatsoever.
 *
 * Mounted under `AuthProvider` so it can read the access token, and only there:
 * a socket opened on the marketing page would authenticate nobody and hold a
 * `UserSession` open for nothing.
 *
 * Note what the backend does on either side of this connection. Every handshake
 * mints a fresh `UserSession`, and closing deletes it. On reconnect
 * `LobbyReconnectService` hands that new session the player's seat — taking it
 * from any older session of theirs, which is what `session:superseded` below
 * announces to the window that lost it — and re-sends `lobby:initialState`
 * unprompted, so nothing here has to ask for the state it lost.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
    // "connecting", not "disconnected": the provider opens a socket on mount,
    // so the gap before that happens is an attempt in progress rather than a
    // lost line, and starting at "disconnected" flashes the reconnect banner
    // across the first paint of every page load.
    const [status, setStatus] = useState<SocketStatus>("connecting");
    const [openedAt, setOpenedAt] = useState(0);

    // The callbacks below run outside React's render cycle and still need to
    // read the current status; `status` itself would be captured stale.
    const statusRef = useRef<SocketStatus>("connecting");
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    const socketRef = useRef<WebSocket | null>(null);
    const listenersRef = useRef<Map<string, Set<Handler>>>(new Map());
    const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const attemptRef = useRef(0);
    // Bumped per attempt, so a slow token fetch cannot hand its socket to a
    // newer attempt that has already started.
    const generationRef = useRef(0);
    // Lets the reconnect timer reach `connect` without the callback having to
    // reference itself before it exists.
    const connectRef = useRef<() => void>(() => {});

    /**
     * Exponential backoff, capped at 30s, with up to a second of jitter so a
     * backend that just came back doesn't take every client at once.
     */
    const scheduleReconnect = useCallback(() => {
        const delay =
            Math.min(30_000, 1000 * 2 ** attemptRef.current) +
            Math.random() * 1000;

        reconnectRef.current = setTimeout(() => connectRef.current(), delay);
        attemptRef.current += 1;
    }, []);

    const disconnect = useCallback(() => {
        // Orphans every callback still holding the old generation.
        generationRef.current += 1;

        if (reconnectRef.current) {
            clearTimeout(reconnectRef.current);
            reconnectRef.current = null;
        }

        socketRef.current?.close();
        socketRef.current = null;
    }, []);

    const connect = useCallback(async () => {
        if (socketRef.current?.readyState === WebSocket.OPEN) return;
        // Terminal: another window has the seat and taking it back here would
        // only bounce it between the two.
        if (statusRef.current === "superseded") return;

        const generation = ++generationRef.current;

        // A current token on *every* attempt, the thirtieth included. Capturing
        // it once and retrying forever with a dead one is the obvious bug here.
        const token = await ensureFreshToken();

        if (generation !== generationRef.current) return;

        if (!token) {
            // Two very different failures arrive here as the same null.
            // `refreshAccessToken` clears local auth when the backend answers
            // 401 — that session really is over — but a refresh that never got
            // an answer at all leaves the session untouched, because the
            // backend being down says nothing about whether the player is
            // signed in. Only the first is terminal; the second is a dropped
            // line like any other, and gets the same backoff.
            if (getAuthSnapshot().status === "unauthenticated") {
                setStatus("auth-failed");
                return;
            }

            setStatus("disconnected");
            scheduleReconnect();
            return;
        }

        setStatus("connecting");

        const socket = new WebSocket(
            `${WS_URL}?token=${encodeURIComponent(token)}`,
        );
        socketRef.current = socket;

        socket.onopen = () => {
            if (generation !== generationRef.current) {
                socket.close();
                return;
            }
            setStatus("connected");
            setOpenedAt(Date.now());
            attemptRef.current = 0;
        };

        socket.onclose = (event) => {
            if (generation !== generationRef.current) return;

            if (event.code === CLOSE_UNAUTHORIZED) {
                setStatus("auth-failed");
                return;
            }

            setStatus("disconnected");
            scheduleReconnect();
        };

        socket.onmessage = (event) => {
            // A frame from a socket we have already walked away from. `onopen`
            // and `onclose` guard the same way; this one matters most, because
            // the backend may not have processed our close before the
            // replacement handshake, and it can still answer the old session
            // with `session:superseded` — a takeover by the very tab reading
            // this. Acting on it would gate the tab against itself.
            if (generation !== generationRef.current) return;

            let message: {
                event?: string;
                data?: unknown;
                message?: string;
                status?: number;
            };

            try {
                message = JSON.parse(event.data);
            } catch {
                console.error("Unparseable WebSocket frame", event.data);
                return;
            }

            if (!message.event) return;

            // Not dispatched to subscribers: there is nothing for a screen to
            // do with it beyond stop, and stopping is the socket's own job.
            if (message.event === "session:superseded") {
                setStatus("superseded");
                disconnect();
                return;
            }

            listenersRef.current
                .get(message.event)
                ?.forEach((handler) => handler(message.data as never));

            // An `error:<command>` frame is also delivered whole to the error
            // channel, so one listener can surface every backend refusal
            // without subscribing to a name per command.
            if (message.event.startsWith("error:")) {
                const error: SocketError = {
                    command: message.event.slice("error:".length),
                    message: message.message ?? "",
                    status: message.status ?? 500,
                };

                listenersRef.current
                    .get(ERROR_CHANNEL)
                    ?.forEach((handler) => handler(error as never));
            }
        };
    }, [disconnect, scheduleReconnect]);

    const reconnect = useCallback(() => {
        disconnect();
        attemptRef.current = 0;
        void connect();
    }, [connect, disconnect]);

    useEffect(() => {
        connectRef.current = () => void connect();
    }, [connect]);

    useEffect(() => {
        // `connect` only reaches a setState after awaiting the token, so nothing
        // here runs synchronously — the lint rule cannot see across the await.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void connect();
        return () => disconnect();
    }, [connect, disconnect]);

    // React to the session ending or returning rather than polling for it.
    useEffect(
        () =>
            subscribeAuth(() => {
                if (getAuthSnapshot().status === "unauthenticated") {
                    disconnect();
                    setStatus("auth-failed");
                    return;
                }

                // A token arriving while we sit in the terminal state means the
                // player signed back in.
                if (statusRef.current === "auth-failed") {
                    attemptRef.current = 0;
                    void connect();
                }
            }),
        [connect, disconnect],
    );

    const send = useCallback(
        <K extends ClientEventName>(
            event: K,
            ...body: ClientEvents[K] extends null ? [] : [ClientEvents[K]]
        ) => {
            if (socketRef.current?.readyState !== WebSocket.OPEN) return;

            // The envelopes are asymmetric on purpose: the server sends `data`,
            // the client sends `body`. Payload-less commands omit the key.
            socketRef.current.send(
                JSON.stringify(
                    body.length ? { event, body: body[0] } : { event },
                ),
            );
        },
        [],
    );

    const listen = useCallback((channel: string, handler: Handler) => {
        let handlers = listenersRef.current.get(channel);

        if (!handlers) {
            handlers = new Set();
            listenersRef.current.set(channel, handlers);
        }

        handlers.add(handler);

        return () => {
            handlers.delete(handler);
            if (handlers.size === 0) listenersRef.current.delete(channel);
        };
    }, []);

    const subscribe = useCallback(
        <K extends ServerEventName>(
            event: K,
            handler: (data: ServerEvents[K]) => void,
        ) => listen(event, handler as Handler),
        [listen],
    );

    const subscribeErrors = useCallback(
        (handler: (error: SocketError) => void) =>
            listen(ERROR_CHANNEL, handler as Handler),
        [listen],
    );

    useEffect(() => {
        if (status !== "connected") return;

        const id = setInterval(() => send("session:keepAlive"), KEEPALIVE_MS);
        return () => clearInterval(id);
    }, [status, send]);

    /**
     * Coming back to the tab remakes the line, rather than waiting to be told
     * it was lost.
     *
     * A backgrounded tab is not a connected one. The keepalive is throttled to
     * a crawl, the backend drops the session it stopped hearing from, and the
     * socket dies — but Safari commonly hands back an `OPEN` socket and no
     * `onclose` at all until the tab is looked at again, so nothing here ever
     * learns the connection ended. Worse, the reconnect backoff is throttled by
     * exactly the same rule: even when the close *is* seen, the retry that
     * would fix it is a background timer, and by the thirtieth attempt that is
     * a wait of half a minute served at background speed.
     *
     * So returning to the tab is treated as its own signal. Anything that
     * suggests the tab has just come back — the visibility flip, a bfcache
     * restore, the network returning, the window being focused — checks the
     * line and, if it has been away long enough to have gone stale, replaces it
     * on the spot. Which is also what recovers the table: a fresh socket is
     * what makes the backend re-send `lobby:initialState`, or say nothing at
     * all if the seat is gone.
     */
    const hiddenSinceRef = useRef<number | null>(null);

    useEffect(() => {
        const wake = () => {
            if (document.visibilityState !== "visible") return;

            const hiddenFor = hiddenSinceRef.current
                ? Date.now() - hiddenSinceRef.current
                : 0;

            hiddenSinceRef.current = null;

            // Terminal, both of them: a new socket would be closed with the
            // same 4401, or would snatch back a seat this window has already
            // been told it lost.
            if (
                statusRef.current === "auth-failed" ||
                statusRef.current === "superseded"
            ) {
                return;
            }

            if (
                socketRef.current?.readyState === WebSocket.OPEN &&
                hiddenFor < STALE_HIDDEN_MS
            ) {
                // Short glance elsewhere: the socket is still good, but its
                // keepalive has been running slow. Send one now rather than at
                // the top of the next interval.
                send("session:keepAlive");
                return;
            }

            reconnect();
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                hiddenSinceRef.current = Date.now();
                return;
            }

            wake();
        };

        const onPageHide = () => {
            hiddenSinceRef.current = Date.now();
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("pagehide", onPageHide);
        window.addEventListener("pageshow", wake);
        window.addEventListener("online", wake);
        // Switching applications does not reliably flip visibility on macOS,
        // and a socket can go stale while the tab is on screen behind another
        // window just as easily as while it is hidden.
        window.addEventListener("focus", wake);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                onVisibilityChange,
            );
            window.removeEventListener("pagehide", onPageHide);
            window.removeEventListener("pageshow", wake);
            window.removeEventListener("online", wake);
            window.removeEventListener("focus", wake);
        };
    }, [reconnect, send]);

    // Built from stable callbacks, so this object outlives every status change
    // under it.
    const commands = useMemo<SocketCommands>(
        () => ({ reconnect, send, subscribe, subscribeErrors }),
        [reconnect, send, subscribe, subscribeErrors],
    );

    return (
        <SocketCommandsContext.Provider value={commands}>
            <SocketSessionContext.Provider value={openedAt}>
                <SocketStatusContext.Provider value={status}>
                    {children}
                </SocketStatusContext.Provider>
            </SocketSessionContext.Provider>
        </SocketCommandsContext.Provider>
    );
}

/**
 * The socket's verbs, without subscribing to its status.
 *
 * This is what anything that only *talks* to the backend should take. Reading
 * the status alongside it is what drags a component into re-rendering on every
 * reconnect.
 */
export function useSocketCommands() {
    const context = useContext(SocketCommandsContext);
    if (context === undefined) {
        throw new Error(
            "useSocketCommands must be used within a SocketProvider",
        );
    }
    return context;
}

/**
 * When the current socket session opened, or 0 before the first one has.
 *
 * Take this to be told that the line was *remade* — a reconnect hands the
 * backend a new `UserSession`, and everything the previous one had established
 * either arrives again in the next few frames or is gone. Unlike the status it
 * does not move during a backoff, so watching it costs one render per
 * successful connection and none per failed attempt.
 */
export function useSocketSession() {
    const context = useContext(SocketSessionContext);
    if (context === undefined) {
        throw new Error(
            "useSocketSession must be used within a SocketProvider",
        );
    }
    return context;
}

/** The connection state on its own, for the components that draw it. */
export function useSocketStatus() {
    const context = useContext(SocketStatusContext);
    if (context === undefined) {
        throw new Error("useSocketStatus must be used within a SocketProvider");
    }
    return context;
}
