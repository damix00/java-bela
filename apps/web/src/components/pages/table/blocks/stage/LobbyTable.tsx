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
    seatIdentity,
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
    hasTable: boolean;
    name: string;
    /** A move into this seat is in flight or has just landed. */
    status?: "pending" | "complete";
    disabled?: boolean;
    onRequestSwap: (seat: number) => void;
};

/**
 * The settle bump: one small scale pulse once the glide has carried the two
 * seats to their new chairs.
 */
const BUMP_START_MS = 420;
const BUMP_END_MS = 820;

/**
 * How long a landed switch holds the seats before they take another press.
 *
 * Tied to the bump rather than picked for feel: clearing the request is what
 * tears down the bump's own timers, so anything shorter than `BUMP_END_MS`
 * strands `bump` at true with no timeout left to reset it.
 */
const SETTLED_HOLD_MS = BUMP_END_MS + 100;

type SwapRequest = {
    fromChair: number;
    /**
     * Keyed by chair rather than by whoever was sitting in it. An empty seat is
     * a move target like any other and has no user to name, and the seat index
     * is the one identifier both kinds of target share.
     */
    targetSeat: number;
};

type ResolvedTableSeatProps = Omit<TableSeatProps, "name"> & {
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

function ResolvedTableSeat({ user, ...seatProps }: ResolvedTableSeatProps) {
    return (
        <TableSeat
            {...seatProps}
            name={getPlayerName(seatProps.player, seatProps.copy, user)}
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
    name,
    status,
    disabled = false,
    onRequestSwap,
}: TableSeatProps) {
    const { suit, tone } = seatIdentity(seat);
    // Every chair but your own, occupied or not. The backend has never been the
    // constraint — `Lobby.swapSeats` takes any index and treats a vacant target
    // as a plain move — and a seat that is dead for a reason the player cannot
    // see is worse than one whose only effect is to rotate the drawing.
    const canMoveHere = hasTable && seat !== chair;
    const handleSwap = useCallback(
        () => onRequestSwap(seat),
        [onRequestSwap, seat],
    );
    const handleClick = canMoveHere ? handleSwap : undefined;

    if (!player && isYou && !hasTable) {
        return (
            <SeatCard
                name={name}
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
                label={copy.openSeat}
                onClick={handleClick}
                actionLabel={copy.lobby.takeSeat}
                swapStatus={status}
                disabled={disabled}
                className="mx-auto size-[52px] shrink-0 self-center sm:size-[80px] lg:size-[176px]"
            />
        );
    }

    const actionLabel = copy.lobby.moveHereWith.replace("{name}", name);
    const ready = player.status === LobbyPlayerStatus.READY;

    if (variant === "side") {
        return (
            <SideSeat
                name={name}
                suit={suit}
                tone={tone}
                ready={ready}
                note={player.host ? copy.lobby.host : copy.lobby.opponent}
                onClick={handleClick}
                actionLabel={actionLabel}
                disabled={disabled}
                swapStatus={status}
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
            name={name}
            meta={meta}
            suit={suit}
            tone={tone}
            tags={tags}
            onClick={handleClick}
            actionLabel={actionLabel}
            status={status}
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
    openSeatCount,
    onSwapSeat,
}: LobbyTableProps) {
    const reduceMotion = useReducedMotion();
    const [swapRequest, setSwapRequest] = useState<SwapRequest | null>(null);
    const [bump, setBump] = useState(false);
    const [near, left, across, right] = seatsFromChair(chair);
    const swapSettled = Boolean(swapRequest && chair !== swapRequest.fromChair);
    const requestSwap = useCallback(
        (seat: number) => {
            if (swapRequest) return;

            setSwapRequest({ fromChair: chair, targetSeat: seat });
            onSwapSeat(seat);
        },
        [chair, onSwapSeat, swapRequest],
    );

    // The socket answers almost immediately, so the settled hold only has to
    // outlast the bump below — long enough for the acknowledgement to play, and
    // no longer, since until it clears the seats refuse the next press. The
    // pending fallback is the other end: it returns the controls if a response
    // is lost during a reconnect.
    useEffect(() => {
        if (!swapRequest) return;

        const timeout = setTimeout(
            () => setSwapRequest(null),
            swapSettled ? SETTLED_HOLD_MS : 2000,
        );

        return () => clearTimeout(timeout);
    }, [swapRequest, swapSettled]);

    // The two seats that traded places do one small settle once the glide has
    // carried them to their new chairs — the table acknowledging the switch.
    useEffect(() => {
        if (!swapSettled || reduceMotion) return;

        const start = setTimeout(() => setBump(true), BUMP_START_MS);
        const clear = setTimeout(() => setBump(false), BUMP_END_MS);

        return () => {
            clearTimeout(start);
            clearTimeout(clear);
        };
    }, [swapSettled, reduceMotion]);

    const transition = reduceMotion
        ? { duration: 0 }
        : {
              type: "spring" as const,
              stiffness: 320,
              damping: 30,
              scale: { duration: 0.35, ease: "easeOut" as const },
          };

    const renderSeat = (
        player: LobbyPlayer | null,
        seat: number,
        isYou: boolean,
        variant: "row" | "side",
    ) => {
        // Keyed by who is in the chair, not by which slot it is: when players
        // change chairs their elements unmount here and mount in the new slot,
        // and Motion's shared layout carries each one from its old bounds to
        // its new ones — size included, so a full-width card shrinks into a
        // side tile instead of snapping between the two.
        const identity = player ? `player-${player.userId}` : `empty-${seat}`;
        const status =
            seat === swapRequest?.targetSeat
                ? swapSettled
                    ? ("complete" as const)
                    : ("pending" as const)
                : undefined;
        // The other half of the trade is whoever the vacated chair now holds —
        // which is nobody at all when the target was empty, so the `player`
        // guard leaves that move settling on its own.
        const bumping =
            bump &&
            Boolean(player && (isYou || seat === swapRequest?.fromChair));

        return (
            <motion.div
                key={identity}
                layoutId={`lobby-${identity}`}
                transition={transition}
                animate={bumping ? { scale: [1, 1.04, 1] } : undefined}
                className="flex size-full">
                <ResolvedTableSeat
                    copy={copy}
                    player={player}
                    seat={seat}
                    chair={chair}
                    isYou={isYou}
                    variant={variant}
                    hasTable={hasTable}
                    user={user}
                    status={status}
                    disabled={swapRequest !== null}
                    onRequestSwap={requestSwap}
                />
            </motion.div>
        );
    };

    return (
        <LayoutGroup id={`lobby-table-${user.id}`}>
            <TableStage
                near={renderSeat(seats[near], near, true, "row")}
                across={renderSeat(seats[across], across, false, "row")}
                left={renderSeat(seats[left], left, false, "side")}
                right={renderSeat(seats[right], right, false, "side")}
                settling={swapRequest !== null}
                centre={
                    <>
                        <CardFan />
                        {openSeatCount !== null ? (
                            <MockLabel className="text-center text-[12px] tracking-normal text-mint/75 normal-case sm:text-[13px]">
                                {copy.seatsOpen.replace(
                                    "{count}",
                                    String(openSeatCount),
                                )}
                            </MockLabel>
                        ) : null}
                        {/* The seats carry a swap badge each, but a badge is a
                            hint and this is the sentence. The felt is the one
                            place on the stage with room for it. */}
                        {hasTable ? (
                            <MockLabel className="text-center text-[11px] font-medium tracking-normal text-mint/50 normal-case sm:text-[12px]">
                                {copy.lobby.moveHint}
                            </MockLabel>
                        ) : null}
                    </>
                }
            />
        </LayoutGroup>
    );
}
