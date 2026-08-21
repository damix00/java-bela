"use client";

import { apiFetch } from "@/api/client";

/**
 * A player as everyone else sees them — `PublicUserResponse.java`.
 *
 * Written out rather than aliased to the generated type for the same reason
 * `api/types/user.ts` is: the generator emits `avatarUrl: string` and
 * `createdAt: Date`, and neither survives contact with the wire.
 */
export type PublicUser = {
    id: string;
    username: string;
    avatarUrl: string | null;
    /** ISO-8601 — `Instant` on the wire, never revived into a Date. */
    createdAt: string;
};

/**
 * Every player this tab has looked up, as an external store.
 *
 * Why a store at all: a `LobbyPlayer` on the wire is
 * `{userId, seat, host, bot, status}` and nothing else, so every name on the
 * table is a separate `GET /users/{id}` — and the same four ids get asked for
 * again on every seat change, every ready toggle and every reconnect snapshot.
 * Cached for the life of the tab. A username can change under us, and a stale
 * one on a lobby seat costs nothing next to a request storm on a screen that
 * re-renders whenever anybody clicks anything.
 *
 * Why an external store rather than state in the hook: this is the same shape
 * as `last-game-mode`. The names genuinely live outside React, and the
 * copy-into-state version has to set state from an effect — which the compiler
 * rejects, and which blanks four seats for a frame every time the table
 * changes. `useSyncExternalStore` reads it without either problem.
 *
 * The snapshot object is always *replaced*, never mutated, or the store cannot
 * be seen to have changed.
 */
let snapshot: Record<string, PublicUser> = {};

const listeners = new Set<() => void>();

/**
 * In-flight requests, so four seats resolving at once don't each fire their own
 * fetch for the same player.
 */
const pending = new Map<string, Promise<PublicUser | null>>();

/** Bot seats carry a synthetic `bot-<hex>` id that no `users` row answers to. */
export function isBotId(userId: string): boolean {
    return userId.startsWith("bot-");
}

export function getUsersSnapshot(): Record<string, PublicUser> {
    return snapshot;
}

/** Server and hydration snapshot: nothing has been fetched yet, by definition. */
const emptySnapshot: Record<string, PublicUser> = {};

export function getServerUsersSnapshot(): Record<string, PublicUser> {
    return emptySnapshot;
}

export function subscribeUsers(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/**
 * Ask for a player, unless we already have them or already asked.
 *
 * Returns nothing: callers read the result out of the store, which is the only
 * place it can be read from consistently. Failures are silent — a name that
 * won't load leaves the seat showing its fallback, and there is nothing the
 * player could do about it anyway.
 */
export function requestUser(userId: string): void {
    // A bot has no account behind it; asking would 404 four times a lobby.
    if (snapshot[userId] || pending.has(userId) || isBotId(userId)) return;

    const request = apiFetch<PublicUser>(`/users/${userId}`)
        .then(({ status, data }) => {
            if (status !== 200 || !data) return null;

            snapshot = { ...snapshot, [userId]: data };
            for (const listener of listeners) listener();

            return data;
        })
        .finally(() => pending.delete(userId));

    pending.set(userId, request);
}
