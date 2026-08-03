export type ConnectionStatus =
    | "connecting"
    | "connected"
    | "disconnected"
    | "error"
    /** Terminal: the session is over, so reconnecting is pointless. */
    | "auth-failed";

export type WebSocketMessage<T = unknown> = {
    event: string;
    body: T;
};

export type EventHandler<T = unknown> = (data: T) => void;
