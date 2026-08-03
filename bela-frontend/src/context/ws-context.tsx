"use client";

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
    ReactNode,
} from "react";
import {
    ConnectionStatus,
    EventHandler,
    WebSocketMessage,
} from "../hooks/ws/types";
import { useAuth } from "@/context/auth-context";
import {
    ensureFreshToken,
    getAuthSnapshot,
    subscribeAuth,
} from "@/api/token-store";
import { useInterval } from "@/hooks/util/useInterval";

type WebSocketContextType = {
    status: ConnectionStatus;
    send: <T>(event: string, data: T) => void;
    subscribe: <T>(event: string, handler: EventHandler<T>) => () => void;
};

const WebSocketContext = createContext<WebSocketContextType | undefined>(
    undefined,
);

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";

/** The backend closes with this code when it could not authenticate the handshake. */
const CLOSE_UNAUTHORIZED = 4401;

export function WebSocketProvider({ children }: { children: ReactNode }) {
    const auth = useAuth();

    const [status, setStatus] = useState<ConnectionStatus>("disconnected");
    // Mirrors `status` for the callbacks below, which run outside React's render cycle
    const statusRef = useRef<ConnectionStatus>("disconnected");
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    const wsRef = useRef<WebSocket | null>(null);
    const listenersRef = useRef<Map<string, Set<EventHandler>>>(new Map());
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const attemptRef = useRef(0);
    // Bumped per attempt so a slow token fetch can't hand its socket to a newer attempt
    const generationRef = useRef(0);
    // Lets the reconnect timer call back into connect without referencing it before it exists
    const connectRef = useRef<() => void>(() => {});

    const connect = useCallback(async () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const generation = ++generationRef.current;

        // Every attempt gets a current token, including the thirtieth — the old code
        // captured the token once and then retried forever with a dead one.
        const token = await ensureFreshToken();

        if (generation !== generationRef.current) return;

        if (!token) {
            // The session is gone; retrying cannot fix that.
            setStatus("auth-failed");
            return;
        }

        setStatus("connecting");

        const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
        wsRef.current = ws;

        ws.onopen = () => {
            if (generation !== generationRef.current) {
                ws.close();
                return;
            }
            setStatus("connected");
            attemptRef.current = 0;
        };

        ws.onclose = (event) => {
            if (generation !== generationRef.current) return;

            if (event.code === CLOSE_UNAUTHORIZED) {
                setStatus("auth-failed");
                return;
            }

            setStatus("disconnected");
            // Auto-reconnect
            // Calculate delay: min(30s, (1s * 2^attempt)) + random jitter
            const delay =
                Math.min(30000, 1000 * Math.pow(2, attemptRef.current)) +
                Math.random() * 1000;
            reconnectTimeoutRef.current = setTimeout(() => {
                connectRef.current();
            }, delay);
            attemptRef.current += 1;
        };

        ws.onerror = () => {
            if (generation !== generationRef.current) return;
            setStatus("error");
        };

        ws.onmessage = (event) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);
                const handlers = listenersRef.current.get(message.event);
                // @ts-ignore
                handlers?.forEach((handler) => handler(message.data));

                // Fan every "error:<originalEvent>" message out to a single
                // "error" channel so a global listener can surface failures.
                if (message.event?.startsWith("error:")) {
                    listenersRef.current
                        .get("error")
                        // @ts-ignore
                        ?.forEach((handler) => handler(message));
                }
            } catch {
                console.error("Failed to parse WebSocket message");
            }
        };
    }, []);

    const disconnect = useCallback(() => {
        generationRef.current += 1;
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        wsRef.current?.close();
        wsRef.current = null;
    }, []);

    useEffect(() => {
        connectRef.current = () => void connect();
    }, [connect]);

    useEffect(() => {
        // connect() only calls setState after awaiting the token fetch, so nothing runs
        // synchronously here — the rule cannot see across the await.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void connect();
        return () => disconnect();
    }, [connect, disconnect]);

    // React to the session ending or coming back, rather than polling the token
    useEffect(() => {
        return subscribeAuth(() => {
            const { status: authStatus } = getAuthSnapshot();

            if (authStatus === "unauthenticated") {
                disconnect();
                setStatus("auth-failed");
                return;
            }

            // A token arriving while we're in the terminal state means the user is back
            if (statusRef.current === "auth-failed") {
                attemptRef.current = 0;
                void connect();
            }
        });
    }, [connect, disconnect]);

    const send = useCallback(<T,>(event: string, body: T) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            const message: WebSocketMessage<T> = { event, body };
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    const subscribe = useCallback(
        <T,>(event: string, handler: EventHandler<T>) => {
            if (!listenersRef.current.has(event)) {
                listenersRef.current.set(event, new Set());
            }
            const handlers = listenersRef.current.get(event)!;
            handlers.add(handler as EventHandler);

            // Return unsubscribe function
            return () => {
                handlers.delete(handler as EventHandler);
                if (handlers.size === 0) {
                    listenersRef.current.delete(event);
                }
            };
        },
        [],
    );

    useInterval(() => {
        if (status !== "connected") return;
        send("session:keepAlive", null);
    }, 5000);

    if (!auth.user) {
        // Losing the session mid-game should show the overlay, not crash the tree
        return null;
    }

    return (
        <WebSocketContext.Provider value={{ status, send, subscribe }}>
            <div className="fixed right-0 p-4 flex items-center gap-2">
                <div
                    className={`w-2 h-2 rounded-full ${
                        status === "connected"
                            ? "bg-primary"
                            : status === "connecting"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                    }`}
                />
                <span className="text-xs text-foreground-muted capitalize">
                    {status}
                </span>
            </div>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error("useWebSocket must be used within a WebSocketProvider");
    }
    return context;
}
