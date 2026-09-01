import { LobbyPlayerStatus, type LobbyPlayer } from "@bela/protocol";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import EmptySeat from "@/components/pages/table/blocks/seats/EmptySeat";
import SeatCard, {
    type SeatTag,
} from "@/components/pages/table/blocks/seats/SeatCard";
import SideSeat from "@/components/pages/table/blocks/seats/SideSeat";
import MockLabel from "@/components/pages/table/blocks/shared/MockLabel";
import CardFan from "@/components/pages/table/blocks/stage/CardFan";
import TableStage from "@/components/pages/table/blocks/stage/TableStage";
import {
    partnerSeat,
    seatsFromChair,
} from "@/components/pages/table/seat-identity";
import type { Seats } from "@/context/lobby-context";
import type { Dictionary } from "@/dictionaries";
import type { User } from "@/api/types/user";

type TableCopy = Dictionary["table"];

type LobbyTableProps = {
    copy: TableCopy;
    user: User;
    seats: Seats;
    chair: number;
    hasTable: boolean;
    /**
     * Seats are pinned while the table is queued for a match.
     *
     * The queue is indexed by the shape the table entered with — how many players it needs on
     * each team — so moving a seat mid-search would leave the waiting ticket describing a table
     * that no longer exists, and the backend refuses it for exactly that reason. Kept separate
     * from `hasTable`, which answers a different question: whether there is a table at all.
     */
    seatsLocked: boolean;
    openSeatCount: number | null;
    onSwapSeat: (seat: number) => void;
};

type TableSeatProps = {
    copy: TableCopy;
    player: LobbyPlayer | null;
    seat: number;
    chair: number;
    isYou: boolean;
    variant: "row" | "side";
    seatsLocked: boolean;
    hasTable: boolean;
    name: string;
    avatarUrl: string | null;
    disabled?: boolean;
    onRequestSwap: (seat: number) => void;
};

/**
 * How long a landed switch holds the seats before they take another press.
 *
 * This only prevents a second request overtaking the socket acknowledgement;
 * the cards complete their shared-layout spring independently.
 */
const SETTLED_HOLD_MS = 650;

/**
 * The lobby is always viewed from the player who first occupied the table.
 *
 * Keeping seat 0 at the near edge makes a chair change read as a player moving
 * between fixed places, instead of rotating every other player around them.
 */
const FIRST_PLAYER_SEAT = 0;

type SwapRequest = {
    fromChair: number;
};

type ResolvedTableSeatProps = Omit<TableSeatProps, "name" | "avatarUrl"> & {
    user: User;
};

function getPlayerName(
    player: LobbyPlayer | null,
    copy: TableCopy,
    user: User,
): string {
    // The only empty seat that displays a name is the signed-in player's
    // stand-in while the lobby is opening.
    if (!player) return user.username;

    // Your own name comes from the session rather than the seat: the seat's
    // copy was taken when you sat down, and a rename since then is yours to
    // see immediately even if the rest of the table is still a beat behind.
    if (player.userId === user.id) return user.username;

    // Bots are named by the server like everyone else, so there is nothing to
    // special-case here. A missing name means a seat filled before this
    // deployment; the fallback covers it until the lobby churns.
    return player.username ?? copy.lobby.unknownPlayer;
}

/**
 * The image beside the name, resolved from the same place the name is.
 *
 * Your own comes from the session for the same reason your name does: the seat
 * copy was taken when you sat down, so a picture changed since then is yours to
 * see straight away. Everyone else's rides along on the seat.
 */
function getPlayerAvatar(
    player: LobbyPlayer | null,
    user: User,
): string | null {
    if (!player || player.userId === user.id) return user.avatarUrl;

    return player.avatarUrl ?? null;
}

function ResolvedTableSeat({ user, ...seatProps }: ResolvedTableSeatProps) {
    return (
        <TableSeat
            {...seatProps}
            name={getPlayerName(seatProps.player, seatProps.copy, user)}
            avatarUrl={getPlayerAvatar(seatProps.player, user)}
        />
    );
}

function TableSeat({
    copy,
    player,
    seat,
    chair,
    isYou,
    variant,
    hasTable,
    seatsLocked,
    name,
    avatarUrl,
    disabled = false,
    onRequestSwap,
}: TableSeatProps) {
    // Every chair but your own, occupied or not. The backend has never been the
    // constraint — `Lobby.swapSeats` takes any index and treats a vacant target
    // as a plain move — and a seat that is dead for a reason the player cannot
    // see is worse than one with no visible outcome.
    const canMoveHere = hasTable && !seatsLocked && seat !== chair;
    const handleSwap = useCallback(
        () => onRequestSwap(seat),
        [onRequestSwap, seat],
    );
    const handleClick = canMoveHere ? handleSwap : undefined;

    if (!player && isYou && !hasTable) {
        return (
            <SeatCard
                avatarUrl={avatarUrl}
                name={name}
                meta=""
                tags={[{ label: copy.you }]}
                className="w-full"
            />
        );
    }

    if (!player) {
        // A vacancy is drawn at the size the seat that fills it will be. In the
        // side columns that is the column itself, so the dashed square and the
        // tile that replaces it have the same footprint and the swap animation
        // has nothing to resize. The row slots have a whole width to spare and
        // take a centred square instead, cut to the same measure.
        return (
            <EmptySeat
                label={copy.openSeat}
                onClick={handleClick}
                actionLabel={copy.lobby.takeSeat}
                disabled={disabled}
                className={
                    variant === "side"
                        ? "size-full"
                        : "mx-auto size-[88px] shrink-0 self-center desk:size-[104px] desk-lg:size-[176px]"
                }
            />
        );
    }

    const actionLabel = copy.lobby.moveHereWith.replace("{name}", name);
    const ready = player.status === LobbyPlayerStatus.READY;

    if (variant === "side") {
        return (
            <SideSeat
                name={name}
                avatarUrl={avatarUrl}
                ready={ready}
                note={
                    isYou
                        ? copy.you
                        : player.host
                          ? copy.lobby.host
                          : copy.lobby.opponent
                }
                onClick={handleClick}
                actionLabel={actionLabel}
                disabled={disabled}
                className="w-full"
            />
        );
    }

    const relation =
        seat === chair
            ? null
            : seat === partnerSeat(chair)
              ? copy.partner
              : copy.lobby.opponent;
    const meta = [relation, player.host ? copy.lobby.host : null]
        .filter(Boolean)
        .join(" · ");
    const tags: SeatTag[] = [
        ...(isYou ? [{ label: copy.you }] : []),
        ...(ready ? [{ label: copy.lobby.ready, tone: "ready" as const }] : []),
    ];

    return (
        <SeatCard
            avatarUrl={avatarUrl}
            name={name}
            meta={meta}
            tags={tags}
            onClick={handleClick}
            actionLabel={actionLabel}
            disabled={disabled}
            className="w-full"
        />
    );
}

export default function LobbyTable({
    copy,
    user,
    seats,
    chair,
    hasTable,
    seatsLocked,
    openSeatCount,
    onSwapSeat,
}: LobbyTableProps) {
    const reduceMotion = useReducedMotion();
    const [swapRequest, setSwapRequest] = useState<SwapRequest | null>(null);
    const [near, left, across, right] = seatsFromChair(FIRST_PLAYER_SEAT);
    const swapSettled = Boolean(swapRequest && chair !== swapRequest.fromChair);
    const requestSwap = useCallback(
        (seat: number) => {
            if (swapRequest) return;

            setSwapRequest({ fromChair: chair });
            onSwapSeat(seat);
        },
        [chair, onSwapSeat, swapRequest],
    );

    // The pending fallback returns the controls if a response is lost during a
    // reconnect. Once acknowledged, the short hold lets the spring finish
    // before another swap starts.
    useEffect(() => {
        if (!swapRequest) return;

        const timeout = setTimeout(
            () => setSwapRequest(null),
            swapSettled ? SETTLED_HOLD_MS : 2000,
        );

        return () => clearTimeout(timeout);
    }, [swapRequest, swapSettled]);

    const transition = reduceMotion
        ? { duration: 0 }
        : {
              type: "spring" as const,
              stiffness: 320,
              damping: 24,
          };

    const renderSeat = (
        player: LobbyPlayer | null,
        seat: number,
        variant: "row" | "side",
    ) => {
        const isYou = seat === chair;
        // Keyed by who is in the chair, not by which slot it is: when players
        // change chairs their elements unmount here and mount in the new slot,
        // and Motion's shared layout carries each one from its old bounds to
        // its new ones — size included, so a full-width card shrinks into a
        // side tile instead of snapping between the two.
        const identity = player ? `player-${player.userId}` : `empty-${seat}`;
        return (
            <motion.div
                key={identity}
                layoutId={`lobby-${identity}`}
                transition={transition}
                className="flex size-full"
            >
                <ResolvedTableSeat
                    copy={copy}
                    player={player}
                    seat={seat}
                    chair={chair}
                    isYou={isYou}
                    variant={variant}
                    hasTable={hasTable}
                    seatsLocked={seatsLocked}
                    user={user}
                    disabled={swapRequest !== null}
                    onRequestSwap={requestSwap}
                />
            </motion.div>
        );
    };

    return (
        <LayoutGroup id={`lobby-table-${user.id}`}>
            <TableStage
                near={renderSeat(seats[near], near, "row")}
                across={renderSeat(seats[across], across, "row")}
                left={renderSeat(seats[left], left, "side")}
                right={renderSeat(seats[right], right, "side")}
                centre={
                    <>
                        <CardFan />
                        {/* The count goes when the felt is too short to hold
                            the fan and a line of type at once. Nothing is lost:
                            the band's own note under the button is the sentence
                            that says how many seats are open, and it is the one
                            with room to say it in words. */}
                        {openSeatCount !== null ? (
                            <MockLabel className="text-center text-[12px] tracking-normal text-mint/75 normal-case portrait-sm:hidden desk:text-[13px]">
                                {copy.seatsOpen.replace(
                                    "{count}",
                                    String(openSeatCount),
                                )}
                            </MockLabel>
                        ) : null}
                        {/* The seats carry a swap badge each, but a badge is a
                            hint and this is the sentence. The felt is the one
                            place on the stage with room for it — and on a phone
                            it isn't: the side seats take their width out of the
                            middle column, and what is left holds the fan and
                            the count and nothing more. The badges and the empty
                            chairs' own arrows carry it alone there. */}
                        {hasTable && !seatsLocked ? (
                            <MockLabel className="hidden text-center text-[11px] font-medium tracking-normal text-mint/50 normal-case desk:block desk:text-[12px]">
                                {copy.lobby.moveHint}
                            </MockLabel>
                        ) : null}
                    </>
                }
            />
        </LayoutGroup>
    );
}
