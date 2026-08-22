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
    teamOf,
} from "@/components/pages/table/seat-identity";
import type { Seats } from "@/context/lobby-context";
import type { Dictionary } from "@/dictionaries";
import { useSeatProfiles } from "@/hooks/use-seat-profiles";
import type { User } from "@/api/types/user";
import { isBotId, type PublicUser } from "@/lib/user-cache";

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
    /** A team switch involving this seat is in flight or has just landed. */
    status?: "pending" | "complete";
    disabled?: boolean;
    onRequestSwap: (seat: number, userId: string) => void;
};

type SwapRequest = {
    fromChair: number;
    targetUserId: string;
};

type ResolvedTableSeatProps = Omit<TableSeatProps, "name"> & {
    user: User;
    profiles: Record<string, PublicUser>;
};

function getPlayerName(
    seat: number,
    player: LobbyPlayer | null,
    copy: TableCopy,
    user: User,
    profiles: Record<string, PublicUser>,
): string {
    // The only empty seat that displays a name is the signed-in player's
    // stand-in while the lobby is opening.
    if (!player) return user.username;

    if (player.bot || isBotId(player.userId)) {
        return copy.lobby.botNames[seat % copy.lobby.botNames.length];
    }

    if (player.userId === user.id) return user.username;

    return profiles[player.userId]?.username ?? copy.lobby.unknownPlayer;
}

function ResolvedTableSeat({
    user,
    profiles,
    ...seatProps
}: ResolvedTableSeatProps) {
    return (
        <TableSeat
            {...seatProps}
            name={getPlayerName(
                seatProps.seat,
                seatProps.player,
                seatProps.copy,
                user,
                profiles,
            )}
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
    // Moving across the table changes teams; moving to the opposite chair on
    // the same team only rotates the drawing. Keep the meaningful action and
    // leave empty seats as status, since invitations happen through the table
    // link below the stage.
    const canSwitchTeams =
        hasTable && Boolean(player) && teamOf(seat) !== teamOf(chair);
    const handleSwap = useCallback(
        () => {
            if (player) onRequestSwap(seat, player.userId);
        },
        [onRequestSwap, player, seat],
    );
    const handleClick = canSwitchTeams ? handleSwap : undefined;

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
                className="mx-auto size-[52px] shrink-0 self-center sm:size-[80px] lg:size-[176px]"
            />
        );
    }

    const actionLabel = copy.lobby.switchTeamsWith.replace("{name}", name);
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
    const profiles = useSeatProfiles(seats);
    const reduceMotion = useReducedMotion();
    const [swapRequest, setSwapRequest] = useState<SwapRequest | null>(null);
    const [bump, setBump] = useState(false);
    const [near, left, across, right] = seatsFromChair(chair);
    const swapSettled = Boolean(
        swapRequest && chair !== swapRequest.fromChair,
    );
    const requestSwap = useCallback(
        (seat: number, targetUserId: string) => {
            if (swapRequest) return;

            setSwapRequest({ fromChair: chair, targetUserId });
            onSwapSeat(seat);
        },
        [chair, onSwapSeat, swapRequest],
    );

    // The socket normally answers almost immediately. Keeping the message long
    // enough to read makes the change legible; the longer pending fallback also
    // returns the controls if a response is lost during a reconnect.
    useEffect(() => {
        if (!swapRequest) return;

        const timeout = setTimeout(
            () => setSwapRequest(null),
            swapSettled ? 1800 : 4000,
        );

        return () => clearTimeout(timeout);
    }, [swapRequest, swapSettled]);

    // The two seats that traded places do one small settle once the glide has
    // carried them to their new chairs — the table acknowledging the switch.
    useEffect(() => {
        if (!swapSettled || reduceMotion) return;

        const start = setTimeout(() => setBump(true), 420);
        const clear = setTimeout(() => setBump(false), 820);

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
            player && player.userId === swapRequest?.targetUserId
                ? swapSettled
                  ? ("complete" as const)
                  : ("pending" as const)
                : undefined;
        const bumping =
            bump &&
            Boolean(
                player &&
                    (isYou || player.userId === swapRequest?.targetUserId),
            );

        return (
            <motion.div
                key={identity}
                layoutId={`lobby-${identity}`}
                transition={transition}
                animate={bumping ? { scale: [1, 1.04, 1] } : undefined}
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
                    user={user}
                    profiles={profiles}
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
                            <MockLabel className="text-center text-[10px] tracking-[.1em] text-mint/75 sm:text-[11px] sm:tracking-[.14em]">
                                {copy.seatsOpen.replace(
                                    "{count}",
                                    String(openSeatCount),
                                )}
                            </MockLabel>
                        ) : null}
                    </>
                }
            />
        </LayoutGroup>
    );
}
