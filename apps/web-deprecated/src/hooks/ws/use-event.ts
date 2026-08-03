"use client";

import { useEffect, useRef, useCallback } from "react";
import { useWebSocket } from "../../context/ws-context";
import { EventHandler } from "./types";

/**
 * Subscribe to a WebSocket event. The handler is called whenever
 * a message with the matching event name is received.
 */
export function useWsEvent<T = unknown>(
    event: string,
    handler: EventHandler<T>,
) {
    const { subscribe } = useWebSocket();
    const handlerRef = useRef(handler);

    // Keep the handler ref updated to avoid stale closures
    handlerRef.current = handler;

    useEffect(() => {
        const wrappedHandler: EventHandler<T> = (data) => {
            handlerRef.current(data);
        };

        return subscribe(event, wrappedHandler);
    }, [event, subscribe]);
}

/**
 * Returns a function to send messages for a specific event type.
 */
export function useWsSend<T = unknown>(event: string) {
    const { send } = useWebSocket();

    return useCallback(
        (data: T) => {
            send(event, data);
        },
        [event, send],
    );
}
