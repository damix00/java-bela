"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

import type { Seats } from "@/context/lobby-context";
import {
    getUsersSnapshot,
    requestUser,
    subscribeUsers,
    type PublicUser,
} from "@/lib/user-cache";

/** The answer for a table with nobody resolved yet, and the server's answer. */
const EMPTY: Record<string, PublicUser> = {};

/** Stable by identity, which is what `useSyncExternalStore` requires of it. */
const getServerSnapshot = () => EMPTY;

/**
 * The usernames behind a table's seats.
 *
 * A `LobbyPlayer` carries an id and nothing else, so every name on the screen
 * is a separate request. They resolve as they arrive rather than all at once —
 * a table that renders four placeholders until the slowest lookup returns is
 * worse than one that fills in.
 *
 * Scoped to the seats it was given. Handing back the whole cache was simpler
 * and meant this table re-rendered whenever *any* user resolved anywhere in the
 * tab — fine while a lobby was the only thing reading the store, and wrong the
 * moment a leaderboard or a friends list writes to it too.
 *
 * The scoping is done in `getSnapshot` rather than with a `useMemo` over the
 * full snapshot, because a memo would narrow the value but not stop the render:
 * the component still wakes for a change it has no interest in. Narrowing here
 * means `useSyncExternalStore` compares the four people at *this* table and
 * bails out before the render happens.
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

    // The previous answer, so an unrelated write to the store can be recognised
    // as a no-op and answered with the object already handed out. Written from
    // inside `getSnapshot`, which React calls while rendering — this is the one
    // place that is sanctioned, and it is what `useSyncExternalStoreWithSelector`
    // does internally for exactly this reason. A fresh object here instead would
    // read as a change on every single pass.
    const cache = useRef<{ ids: string; value: Record<string, PublicUser> }>({
        ids: "",
        value: EMPTY,
    });

    const getSnapshot = useCallback(() => {
        const all = getUsersSnapshot();

        const next: Record<string, PublicUser> = {};
        let found = 0;

        if (ids) {
            for (const id of ids.split(",")) {
                const user = all[id];
                if (user) {
                    next[id] = user;
                    found += 1;
                }
            }
        }

        // A cached `PublicUser` is replaced, never mutated, so identity per id
        // is enough to tell whether this table's slice actually moved.
        const previous = cache.current;
        if (previous.ids === ids && Object.keys(previous.value).length === found) {
            let unchanged = true;

            for (const id in next) {
                if (previous.value[id] !== next[id]) {
                    unchanged = false;
                    break;
                }
            }

            if (unchanged) return previous.value;
        }

        cache.current = { ids, value: found ? next : EMPTY };
        return cache.current.value;
    }, [ids]);

    return useSyncExternalStore(subscribeUsers, getSnapshot, getServerSnapshot);
}
