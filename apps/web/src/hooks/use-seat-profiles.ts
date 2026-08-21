"use client";

import { useEffect, useSyncExternalStore } from "react";

import type { Seats } from "@/context/lobby-context";
import {
    getServerUsersSnapshot,
    getUsersSnapshot,
    requestUser,
    subscribeUsers,
    type PublicUser,
} from "@/lib/user-cache";

/**
 * The usernames behind a table's seats.
 *
 * A `LobbyPlayer` carries an id and nothing else, so every name on the screen
 * is a separate request. They resolve as they arrive rather than all at once —
 * a table that renders four placeholders until the slowest lookup returns is
 * worse than one that fills in.
 *
 * Reads the whole cache rather than a slice of it. Narrowing to these four ids
 * would mean building a new object every render, which `useSyncExternalStore`
 * would see as a change on every pass; the caller only ever looks up the ids it
 * has anyway.
 */
export function useSeatProfiles(seats: Seats): Record<string, PublicUser> {
    // The ids, not the seats: swapping two players around the table changes
    // every seat object and none of the people at it.
    const ids = seats
        .map((player) => player?.userId ?? "")
        .filter(Boolean)
        .sort()
        .join(",");

    useEffect(() => {
        if (!ids) return;

        for (const id of ids.split(",")) requestUser(id);
    }, [ids]);

    return useSyncExternalStore(
        subscribeUsers,
        getUsersSnapshot,
        getServerUsersSnapshot,
    );
}
