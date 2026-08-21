"use client";

import { useEffect, useRef } from "react";
import type { ServerEventName, ServerEvents } from "@bela/protocol";

import { useSocket, type SocketError } from "@/context/socket-context";

/**
 * Subscribe to one server event for as long as the component is mounted.
 *
 * The handler is held in a ref and read at call time, so a component can pass a
 * fresh closure every render without resubscribing — and without the socket
 * calling last render's closure over stale props.
 */
export function useSocketEvent<K extends ServerEventName>(
    event: K,
    handler: (data: ServerEvents[K]) => void,
) {
    const { subscribe } = useSocket();
    const handlerRef = useRef(handler);

    // After every render rather than during it: a ref written mid-render is
    // state mutated mid-render, and the compiler is right to refuse it. The
    // subscription below only reads the ref when a frame actually arrives,
    // which is long after this has run.
    useEffect(() => {
        handlerRef.current = handler;
    });

    useEffect(
        () => subscribe(event, (data) => handlerRef.current(data)),
        [event, subscribe],
    );
}

/**
 * Every `error:*` frame the backend sends back, on one channel.
 *
 * Filter on `error.command` — it is the name of the command that failed, so a
 * screen that only cares about its own join attempt can ignore the rest.
 */
export function useSocketErrors(handler: (error: SocketError) => void) {
    const { subscribeErrors } = useSocket();
    const handlerRef = useRef(handler);

    useEffect(() => {
        handlerRef.current = handler;
    });

    useEffect(
        () => subscribeErrors((error) => handlerRef.current(error)),
        [subscribeErrors],
    );
}
