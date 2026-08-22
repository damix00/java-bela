"use client";

import ConnectionNotice from "@/components/pages/table/blocks/lobby/ConnectionNotice";
import LobbyBand from "@/components/pages/table/blocks/lobby/LobbyBand";
import LobbyTable from "@/components/pages/table/blocks/stage/LobbyTable";
import {
    SEAT_COUNT,
    SNAPSHOT_GRACE_MS,
    useLobby,
    useLobbyActions,
} from "@/context/lobby-context";
import { useSocketStatus } from "@/context/socket-context";
import { useCallback, useEffect, useRef } from "react";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n";
import { localiseLobbyError } from "@/lib/lobby-errors";
import { appGutters } from "@/lib/styles";
import type { User } from "@/api/types/user";

type TableScreenProps = {
    copy: Dictionary["table"];
    locale: Locale;
    /**
     * The signed-in player, read on the server.
     *
     * Handed down rather than pulled from `useAuth`: the token store is seeded
     * in an effect, so context still says "signed out" for one pass after
     * hydration and this screen would render its own seat a beat late.
     */
    user: User;
    /** Anonymous account — see `TableRules`, the only part that cares. */
    guest: boolean;
    signUpHref: string;
};

/**
 * The lobby, and the site's front door.
 *
 * One screen, two states, and the same furniture in both. Empty, it is your own
 * seat and three open ones with the mode band underneath; in a table, the same
 * four seats hold real people and the band becomes the invite code and the
 * ready button. Nothing moves between the two — the table is what is being
 * filled either way, and a layout that rearranged itself the moment somebody
 * pressed play would make the press feel like a navigation.
 *
 * The screen is sized to be exactly one screen. The stage is centred in
 * whatever height is left under the header rather than stacking from the top,
 * because leftover space split above and below reads as a table with room
 * around it, while the same space pooled at the bottom reads as a page that ran
 * out of content. The felt underneath does the rest of that work.
 */
export default function TableScreen({
    copy,
    locale,
    user,
    guest,
    signUpHref,
}: TableScreenProps) {
    const { lobby, seats, me, playerCount, error } = useLobby();
    const { create, swapSeat } = useLobbyActions();
    const status = useSocketStatus();
    // One attempt per visit. A second `lobby:create` would only be answered
    // with "already in lobby", and a retry loop against that is a request every
    // frame for as long as the tab is open.
    const requested = useRef(false);
    const requestLobby = useCallback(() => {
        requested.current = true;
        create();
    }, [create]);

    /**
     * The table opens itself.
     *
     * Pressing a button to be given a table you were always going to be given
     * is a step with no decision in it — the mode selector that used to stand
     * here offered three choices and two of them were unbuilt. So the lobby is
     * created on arrival, and the first thing on screen is the code that fills
     * it.
     *
     * The pause before creating is not a nicety. A reconnect makes the backend
     * re-send `lobby:initialState` unprompted for a player who is already
     * seated somewhere, and creating in that window would race the snapshot and
     * lose — the backend refuses with "already in lobby" for a table the player
     * is quite happily sitting at. Waiting a moment lets the snapshot land
     * first, and the effect re-runs and stands down when it does.
     */
    useEffect(() => {
        if (lobby || status !== "connected" || requested.current) return;

        const id = setTimeout(requestLobby, SNAPSHOT_GRACE_MS);

        return () => clearTimeout(id);
    }, [lobby, status, requestLobby]);

    const t = copy.lobby;

    const chair = me?.seat ?? 0;
    const hasTable = lobby !== null;

    return (
        <div className="flex flex-1 flex-col">
            {/* Outside the column on purpose — it is pinned to the viewport,
                and leaving it among the seats invited someone to give it a
                margin and put the jump back. */}
            <ConnectionNotice copy={copy.connection} locale={locale} />

            <main
                className={cn(
                    "flex flex-1 flex-col justify-center py-8 md:py-10",
                    appGutters,
                )}
            >
                <div className="flex min-w-0 flex-col gap-8 sm:gap-10">
                    <LobbyTable
                        copy={copy}
                        user={user}
                        seats={seats}
                        chair={chair}
                        hasTable={hasTable}
                        openSeatCount={
                            hasTable ? SEAT_COUNT - playerCount : null
                        }
                        onSwapSeat={swapSeat}
                    />

                    {lobby ? (
                        <LobbyBand
                            copy={copy}
                            locale={locale}
                            signUpHref={signUpHref}
                            guest={guest}
                        />
                    ) : (
                        <p
                            role="status"
                            className="mx-auto text-center text-[13px] font-semibold text-mint/75 sm:text-[14px]"
                        >
                            {error
                                ? localiseLobbyError(error, copy.lobbyErrors)
                                : t.opening}
                        </p>
                    )}
                </div>
            </main>
        </div>
    );
}
