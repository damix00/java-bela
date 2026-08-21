"use client";

import { useEffect, useEffectEvent } from "react";
import type { ServerEventName, ServerEvents } from "@bela/protocol";

import {
    useSocketCommands,
    type SocketError,
} from "@/context/socket-context";

/**
 * Subscribe to one server event for as long as the component is mounted.
 *
 * The handler is wrapped in `useEffectEvent`, so a component can pass a fresh
 * closure every render without resubscribing — and without the socket calling
 * last render's closure over stale props.
 *
 * That wrapper replaces the latest-ref pattern this used to carry, which needed
 * an effect with no dependency array to keep the ref current. A dep-less effect
 * runs after *every* render, and `LobbyProvider` mounts eight of these, so a
 * single lobby render scheduled eight callbacks whose only job was an
 * assignment. `useEffectEvent` is stable by construction and reads the latest
 * render's closure when it is called, which is what the ref was imitating.
 */
export function useSocketEvent<K extends ServerEventName>(
    event: K,
    handler: (data: ServerEvents[K]) => void,
) {
    const { subscribe } = useSocketCommands();
    const onEvent = useEffectEvent(handler);

    // `subscribe` is stable and `onEvent` is stable, so this runs on mount and
    // on nothing else.
    useEffect(() => subscribe(event, onEvent), [event, subscribe]);
}

/**
 * Every `error:*` frame the backend sends back, on one channel.
 *
 * Filter on `error.command` — it is the name of the command that failed, so a
 * screen that only cares about its own join attempt can ignore the rest.
 */
export function useSocketErrors(handler: (error: SocketError) => void) {
    const { subscribeErrors } = useSocketCommands();
    const onError = useEffectEvent(handler);

    useEffect(() => subscribeErrors(onError), [subscribeErrors]);
}
