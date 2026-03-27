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

export function WebSocketProvider({ children }: { children: ReactNode }) {
    const auth = useAuth();

    const [status, setStatus] = useState<ConnectionStatus>("disconnected");
    const wsRef = useRef<WebSocket | null>(null);
    const listenersRef = useRef<Map<string, Set<EventHandler>>>(new Map());
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const attemptRef = useRef(0);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        setStatus("connecting");

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            setStatus("connected");
        };

        ws.onclose = () => {
            setStatus("disconnected");
            // Auto-reconnect
            // Calculate delay: min(30s, (1s * 2^attempt)) + random jitter
            const delay =
                Math.min(30000, 1000 * Math.pow(2, attemptRef.current)) +
                Math.random() * 1000;
            reconnectTimeoutRef.current = setTimeout(connect, delay);
            attemptRef.current += 1;
        };

        ws.onerror = () => {
            setStatus("error");
        };

        ws.onmessage = (event) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);
                // @ts-ignore
                const handlers = listenersRef.current.get(message.eventName);
                handlers?.forEach((handler) => handler(message.body));
            } catch {
                console.error("Failed to parse WebSocket message");
            }
        };
    }, []);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        wsRef.current?.close();
        wsRef.current = null;
    }, []);

    useEffect(() => {
        connect();
        return () => disconnect();
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
        send("session:keep-alive", null);
    }, 10000);

    if (!auth.user) {
        throw new Error("WebSocketProvider requires an authenticated user");
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
