"use client";

import { LobbyPlayerStatus } from "@bela/protocol";

import CardFan from "@/components/pages/table/blocks/CardFan";
import ConnectionNotice from "@/components/pages/table/blocks/ConnectionNotice";
import EmptySeat from "@/components/pages/table/blocks/EmptySeat";
import LobbyBand from "@/components/pages/table/blocks/LobbyBand";
import MockLabel from "@/components/pages/table/blocks/MockLabel";
import SeatCard from "@/components/pages/table/blocks/SeatCard";
import SideSeat from "@/components/pages/table/blocks/SideSeat";
import TableStage from "@/components/pages/table/blocks/TableStage";
import {
    partnerSeat,
    seatIdentity,
    seatsFromChair,
} from "@/components/pages/table/seat-identity";
import {
    SEAT_COUNT,
    SNAPSHOT_GRACE_MS,
    useLobby,
    useLobbyActions,
} from "@/context/lobby-context";
import { useSocketStatus } from "@/context/socket-context";
import { useSeatProfiles } from "@/hooks/use-seat-profiles";
import { useEffect, useMemo, useRef } from "react";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n";
import { localiseLobbyError } from "@/lib/lobby-errors";
import { appGutters } from "@/lib/styles";
import { isBotId } from "@/lib/user-cache";
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
    const profiles = useSeatProfiles(seats);

    // One attempt per visit. A second `lobby:create` would only be answered
    // with "already in lobby", and a retry loop against that is a request every
    // frame for as long as the tab is open.
    const requested = useRef(false);

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

        const id = setTimeout(() => {
            requested.current = true;
            create();
        }, SNAPSHOT_GRACE_MS);

        return () => clearTimeout(id);
    }, [lobby, status, create]);

    const t = copy.lobby;

    // Laid out from the reader's chair: their partner opposite, the opposing
    // pair to either side. With no chair yet — the idle screen — seat 0 stands
    // in, which puts the player at the near edge either way.
    const chair = me?.seat ?? 0;

    // Whether there is a table, as a boolean rather than the lobby itself. The
    // seats below only ever ask *if* one exists — to decide whether a chair can
    // be clicked, and whether the near seat is the idle screen's stand-in — and
    // depending on the object instead would rebuild all four of them every time
    // any unrelated field of the lobby changed, the match type included.
    const hasTable = lobby !== null;

    /**
     * The four seats, already rendered.
     *
     * Memoised as *elements* rather than left as calls in the JSX, because the
     * helpers below are closures: `onClick={seatAction(seat)}` is a new
     * function on every pass, and `tags={[...]}` a new array, so no amount of
     * `memo()` on `SeatCard` could ever let it bail out. Holding the element
     * means React compares one reference and skips the whole subtree — which is
     * what makes a reconnect blip, or a ready toggle three seats away, cost
     * nothing here.
     *
     * The helpers live inside the memo for the same reason. Outside it they
     * would each need their own `useCallback` before they could be depended on,
     * and the dependency list would be six entries of bookkeeping instead of
     * the state this actually reads.
     */
    const [nearSeat, leftSeat, acrossSeat, rightSeat] = useMemo(() => {
        const [near, left, across, right] = seatsFromChair(chair);

        function nameFor(seat: number): string {
            const player = seats[seat];
            if (!player) return "";

            if (player.bot || isBotId(player.userId)) {
                return t.botNames[seat % t.botNames.length];
            }

            if (player.userId === user.id) return user.username;

            // A name still in flight. The seat is drawn either way — a table that
            // waits for four lookups before showing anybody is a blank screen for
            // as long as the slowest one takes.
            return profiles[player.userId]?.username ?? t.unknownPlayer;
        }

        /** What clicking a seat does, or nothing when there is no table to sit at. */
        function seatAction(seat: number) {
            if (!hasTable || seat === chair) return undefined;
            return () => swapSeat(seat);
        }

        function seatActionLabel(seat: number) {
            const player = seats[seat];

            return player
                ? t.swapWith.replace("{name}", nameFor(seat))
                : t.takeSeat;
        }

        /**
         * The line under a name: who they are to you, and what they are doing.
         *
         * Your own seat gets no relation — you are neither your partner nor your
         * opponent, and the tag beside the name has already said which chair this
         * is. It can still say you are the host, which is the one thing about
         * yourself the table needs to tell you.
         */
        function metaFor(seat: number): string {
            const player = seats[seat];
            if (!player) return "";

            const relation =
                seat === chair
                    ? null
                    : seat === partnerSeat(chair)
                      ? copy.partner
                      : t.opponent;

            return [relation, player.host ? t.host : null]
                .filter(Boolean)
                .join(" · ");
        }

        function renderRowSeat(seat: number, isYou: boolean) {
            const player = seats[seat];
            const { suit, tone } = seatIdentity(seat);

            // Before there is a table, the near seat is still occupied — by the
            // person looking at it. Drawing four empty chairs would be truer to the
            // lobby state and worse as a picture of what pressing play does.
            if (!player && isYou && !hasTable) {
                return (
                    <SeatCard
                        name={user.username}
                        // Nothing true to say under the name yet: there is no
                        // partner to be across from and no deal to be holding.
                        meta=""
                        suit={suit}
                        tone={tone}
                        tags={[{ label: copy.you }]}
                        className="w-full"
                    />
                );
            }

            if (!player) {
                return (
                    <EmptySeat
                        label={copy.inviteSeat}
                        onClick={seatAction(seat)}
                        className={
                            isYou
                                ? "w-full"
                                : "mx-auto size-[60px] shrink-0 sm:size-[104px] lg:size-[240px]"
                        }
                    />
                );
            }

            return (
                <SeatCard
                    name={nameFor(seat)}
                    meta={metaFor(seat)}
                    suit={suit}
                    tone={tone}
                    tags={[
                        ...(isYou ? [{ label: copy.you }] : []),
                        ...(player.status === LobbyPlayerStatus.READY
                            ? [{ label: t.ready, tone: "ready" as const }]
                            : []),
                    ]}
                    onClick={seatAction(seat)}
                    actionLabel={seatActionLabel(seat)}
                    className="w-full"
                />
            );
        }

        function renderSideSeat(seat: number) {
            const player = seats[seat];
            const { suit, tone } = seatIdentity(seat);

            if (!player) {
                return (
                    <EmptySeat
                        label={copy.inviteSeat}
                        onClick={seatAction(seat)}
                        className="w-full"
                    />
                );
            }

            return (
                <SideSeat
                    name={nameFor(seat)}
                    suit={suit}
                    tone={tone}
                    ready={player.status === LobbyPlayerStatus.READY}
                    note={player.host ? t.host : t.opponent}
                    onClick={seatAction(seat)}
                    actionLabel={seatActionLabel(seat)}
                    className="w-full"
                />
            );
        }

        return [
            renderRowSeat(near, true),
            renderSideSeat(left),
            renderRowSeat(across, false),
            renderSideSeat(right),
        ];
    }, [chair, seats, hasTable, profiles, user, copy, t, swapSeat]);

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
                    <TableStage
                        near={nearSeat}
                        across={acrossSeat}
                        left={leftSeat}
                        right={rightSeat}
                        centre={
                            <>
                                <CardFan />
                                {/* How much room is left, not the code — the
                                    code lives in the band below next to the
                                    button that copies it, and repeating it on a
                                    screen this sparse reads as two codes rather
                                    than one. */}
                                {lobby && (
                                    <MockLabel className="text-center text-[10px] tracking-[.1em] text-mint/75 sm:text-[11px] sm:tracking-[.14em]">
                                        {copy.seatsOpen.replace(
                                            "{count}",
                                            String(SEAT_COUNT - playerCount),
                                        )}
                                    </MockLabel>
                                )}
                            </>
                        }
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
