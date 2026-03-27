export type ConnectionStatus =
    | "connecting"
    | "connected"
    | "disconnected"
    | "error";

export type WebSocketMessage<T = unknown> = {
    event: string;
    body: T;
};

export type EventHandler<T = unknown> = (data: T) => void;
