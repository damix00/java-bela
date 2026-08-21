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
const KEEPALIVE_MS = 5_000;

export type SocketStatus =
    | "connecting"
    | "connected"
    | "disconnected"
    /** Terminal. The session is over, so reconnecting cannot help. */
    | "auth-failed";

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
 * mints a fresh `UserSession`, and closing deletes it — which is what releases
 * the single-device lock, so a dropped connection doesn't strand the player
 * outside their own table. And on reconnect `LobbyReconnectService` re-locks the
 * session and re-sends `lobby:initialState` unprompted, so nothing here has to
 * ask for the state it lost.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
    // "connecting", not "disconnected": the provider opens a socket on mount,
    // so the gap before that happens is an attempt in progress rather than a
    // lost line, and starting at "disconnected" flashes the reconnect banner
    // across the first paint of every page load.
    const [status, setStatus] = useState<SocketStatus>("connecting");

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

    const connect = useCallback(async () => {
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

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
            let message: { event?: string; data?: unknown; message?: string; status?: number };

            try {
                message = JSON.parse(event.data);
            } catch {
                console.error("Unparseable WebSocket frame", event.data);
                return;
            }

            if (!message.event) return;

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
    }, [scheduleReconnect]);

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

    // Built once: every dependency is a `useCallback` with no dependencies of
    // its own, so this object outlives every status change under it.
    const commands = useMemo<SocketCommands>(
        () => ({ send, subscribe, subscribeErrors }),
        [send, subscribe, subscribeErrors],
    );

    return (
        <SocketCommandsContext.Provider value={commands}>
            <SocketStatusContext.Provider value={status}>
                {children}
            </SocketStatusContext.Provider>
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
        throw new Error("useSocketCommands must be used within a SocketProvider");
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
