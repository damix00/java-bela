import { LobbyPlayerStatus, type LobbyPlayer } from "@bela/protocol";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import EmptySeat from "@/components/pages/table/blocks/seats/EmptySeat";
import SeatTile from "@/components/pages/table/blocks/seats/SeatTile";
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

    // The only empty seat that shows a person is the signed-in player's stand-in
    // while the lobby is opening.
    if (!player && isYou && !hasTable) {
        return (
            <SeatTile
                avatarUrl={avatarUrl}
                name={name}
                note={copy.you}
                className="size-full"
            />
        );
    }

    if (!player) {
        // A vacancy is drawn at the size of the seat that fills it, which is now
        // the same size everywhere: the slot itself. The dashed square and the
        // tile that replaces it have one footprint between them, so a swap has
        // nothing to resize.
        return (
            <EmptySeat
                label={copy.openSeat}
                onClick={handleClick}
                actionLabel={copy.lobby.takeSeat}
                disabled={disabled}
                className="size-full"
            />
        );
    }

    return (
        <SeatTile
            name={name}
            avatarUrl={avatarUrl}
            ready={player.status === LobbyPlayerStatus.READY}
            note={seatNote(copy, player, seat, chair, isYou)}
            onClick={handleClick}
            actionLabel={copy.lobby.moveHereWith.replace("{name}", name)}
            disabled={disabled}
            className="size-full"
        />
    );
}

/**
 * The one line under the name, in the order a player would want it.
 *
 * The tile has room for a single word where the old wide card had a row of
 * tags, so they are ranked rather than listed: which seat is yours first,
 * then who you are playing with, and only then who opened the table. Being the
 * host changes nothing about the hand you are dealt; being across from someone
 * decides it.
 */
function seatNote(
    copy: TableCopy,
    player: LobbyPlayer,
    seat: number,
    chair: number,
    isYou: boolean,
): string {
    if (isYou) return copy.you;
    if (seat === partnerSeat(chair)) return copy.lobby.partner;
    if (player.host) return copy.lobby.host;

    return copy.lobby.opponent;
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
              damping: 28,
          };

    const renderSeat = (player: LobbyPlayer | null, seat: number) => {
        const isYou = seat === chair;
        // Keyed by who is in the chair, not by which slot it is: when players
        // change chairs their elements unmount here and mount in the new slot,
        // and Motion's shared layout carries each one from its old bounds to
        // its new ones. Every slot is the same square, so that is a travel
        // across the table and nothing else.
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
                near={renderSeat(seats[near], near)}
                across={renderSeat(seats[across], across)}
                left={renderSeat(seats[left], left)}
                right={renderSeat(seats[right], right)}
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
