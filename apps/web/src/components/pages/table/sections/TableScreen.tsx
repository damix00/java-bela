"use client";

import { useRouter } from "next/navigation";
import { LobbyStatus } from "@bela/protocol";
import { useEffect, useRef } from "react";

import type { User } from "@/api/types/user";
import ConnectionNotice from "@/components/pages/table/blocks/lobby/ConnectionNotice";
import LobbyBand from "@/components/pages/table/blocks/lobby/LobbyBand";
import LobbyBandSkeleton from "@/components/pages/table/blocks/lobby/LobbyBandSkeleton";
import LobbyTable from "@/components/pages/table/blocks/stage/LobbyTable";
import {
    SEAT_COUNT,
    SNAPSHOT_GRACE_MS,
    useLobby,
    useLobbyActions,
} from "@/context/lobby-context";
import {
    useSocketCommands,
    useSocketSession,
    useSocketStatus,
    type SocketError,
} from "@/context/socket-context";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/ui/cn";
import type { Locale } from "@/lib/i18n/config";
import { forgetLobby, recallLobby } from "@/lib/game/last-lobby";
import { isAlreadyInLobby, localiseLobbyError } from "@/lib/game/lobby-errors";
import { playPath } from "@/lib/navigation/routes";
import { appGutters } from "@/lib/ui/styles";

/** How often to re-ask for a table the backend thinks we are already at. */
const STALE_LOBBY_RETRY_MS = 3000;

/**
 * A refusal that reconnecting can resolve into an existing snapshot.
 *
 * Both of this screen's automatic commands can earn it. "Already in lobby"
 * means the backend still has us seated somewhere — the presence outlived the
 * connection that made it — and it hands an existing lobby over during its
 * *reconnect* lifecycle and nowhere else, so neither retrying the command nor
 * asking for a different one gets us there.
 */
function isRecoverableError(error: SocketError): boolean {
    return (
        (error.command === "lobby:create" ||
            error.command === "lobby:join:code") &&
        isAlreadyInLobby(error)
    );
}

/**
 * A refusal from the automatic rejoin below, which the player should not read.
 *
 * Every `lobby:join:code` failure on this screen is one: the invite route is a
 * different screen and shows its own. Ours is not news — the table it names is
 * one the player left by tabbing away, and a fresh one is already opening in
 * its place.
 */
function isSilentRejoinError(error: SocketError): boolean {
    return error.command === "lobby:join:code";
}

/**
 * How far this screen has got with getting the player a table, for the socket
 * session in hand. One pass per connection: rejoin the last table if there is
 * one to rejoin, otherwise open a new one.
 */
type Attempt = "idle" | "rejoining" | "creating";

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
    const { lobby, seats, me, playerCount, isSearching, error } = useLobby();
    const { create, joinByCode, swapSeat } = useLobbyActions();
    const status = useSocketStatus();
    const openedAt = useSocketSession();
    const { reconnect } = useSocketCommands();
    const router = useRouter();

    /**
     * An in-progress table is not a lobby destination.
     *
     * The provider survives client-side navigation between the game and this
     * page, so clicking the logo does not reconnect the socket and therefore
     * does not produce another `lobby:initialState` frame. Read the snapshot we
     * already hold when this screen mounts and send the player back to the game.
     */
    useEffect(() => {
        if (lobby?.status !== LobbyStatus.IN_GAME || !lobby.gameId) return;

        router.replace(playPath(locale, lobby.gameId));
    }, [lobby, locale, router]);

    // One pass per socket session. A second `lobby:create` on the same
    // connection would only be answered with "already in lobby", and a retry
    // loop against that is a request every frame for as long as the tab is
    // open. A *new* connection is a different matter: it is the one moment the
    // answer can have changed.
    const attempt = useRef<Attempt>("idle");

    /**
     * A remade line gets a fresh attempt.
     *
     * Tab away long enough and the backend drops the session and evicts the
     * seat; coming back opens a new socket that is told about no table at all.
     * Without this the screen sits on its one spent attempt and waits forever
     * for a snapshot that is never coming, under the opening skeleton.
     *
     * Cleared in an effect rather than beside the create so the ordering is not
     * in question: this commits before the effect below re-runs for the same
     * session.
     */
    useEffect(() => {
        attempt.current = "idle";
    }, [openedAt]);

    /**
     * The table opens itself — the one it had, if that one can be had.
     *
     * Pressing a button to be given a table you were always going to be given
     * is a step with no decision in it — the mode selector that used to stand
     * here offered three choices and two of them were unbuilt. So a lobby is
     * there on arrival, and the first thing on screen is the code that fills
     * it.
     *
     * Which lobby is the part that matters. Tab away for long enough — copying
     * the invite link and switching apps to send it is the ordinary way — and
     * the backend eventually takes the seat back, so the reconnect on return
     * brings no snapshot. Creating outright at that point hands the player a
     * new table with a new code, having just watched them send out the old one.
     * So the remembered code is spent first, on the same `lobby:join:code` an
     * invited friend uses; only if that table is truly gone does a new one open,
     * and it opens without comment.
     *
     * The pause before either is not a nicety. A reconnect makes the backend
     * re-send `lobby:initialState` unprompted for a player who is still seated,
     * and acting inside that window races the snapshot and loses — the backend
     * refuses both commands with "already in lobby" for a table the player is
     * quite happily sitting at. Waiting a moment lets the snapshot land first,
     * and the effect re-runs and stands down when it does.
     */
    useEffect(() => {
        if (lobby || status !== "connected" || attempt.current !== "idle") {
            return;
        }

        const id = setTimeout(() => {
            const code = recallLobby();

            if (code) {
                attempt.current = "rejoining";
                joinByCode(code);
                return;
            }

            attempt.current = "creating";
            create();
        }, SNAPSHOT_GRACE_MS);

        return () => clearTimeout(id);
    }, [lobby, status, create, joinByCode]);

    /**
     * The rejoin missed, so open a new table instead.
     *
     * No pause and no retry: the refusal *is* the answer. The lobby was deleted
     * once the last of us was evicted from it, or the friends who were sent the
     * code filled the last seat while we were away. Either way that table is
     * not somewhere the player can be put back, and the code is worth nothing
     * now — `create` clears the refusal on its way out, so none of this is ever
     * seen.
     *
     * "Already in lobby" is the exception and is left to the effect below,
     * which remakes the line rather than giving up on the table.
     */
    useEffect(() => {
        if (lobby || status !== "connected") return;
        if (attempt.current !== "rejoining") return;
        if (!error || !isSilentRejoinError(error) || isRecoverableError(error)) {
            return;
        }

        forgetLobby();
        attempt.current = "creating";
        create();
    }, [lobby, status, error, create]);

    /**
     * A seat the backend still remembers finds its way back here.
     *
     * "Already in lobby" means the presence outlived the connection that made
     * it — the tab was away long enough to lose its socket, or two of our own
     * frames raced. Neither command above can resolve it: the backend hands an
     * existing lobby over during its *reconnect* lifecycle and nowhere else. So
     * remake the line and let the snapshot arrive on its own.
     */
    useEffect(() => {
        if (
            lobby ||
            status !== "connected" ||
            !error ||
            !isRecoverableError(error)
        ) {
            return;
        }

        const id = setTimeout(reconnect, STALE_LOBBY_RETRY_MS);

        return () => clearTimeout(id);
    }, [lobby, status, error, reconnect]);

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
                    "flex flex-1 flex-col justify-center py-4 portrait-sm:py-2 desk:py-8 desk-md:py-10",
                    appGutters,
                )}
            >
                <div className="flex min-w-0 flex-col gap-5 portrait-sm:gap-3 desk:gap-8 desk-lg:gap-10">
                    <LobbyTable
                        copy={copy}
                        user={user}
                        seats={seats}
                        chair={chair}
                        hasTable={hasTable}
                        seatsLocked={isSearching}
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
                    ) : error &&
                      !isRecoverableError(error) &&
                      !isSilentRejoinError(error) ? (
                        <p
                            role="status"
                            className="mx-auto text-center text-[13px] font-semibold text-mint/75 sm:text-[14px]"
                        >
                            {localiseLobbyError(error, copy.lobbyErrors)}
                        </p>
                    ) : (
                        <LobbyBandSkeleton label={t.opening} />
                    )}
                </div>
            </main>
        </div>
    );
}
