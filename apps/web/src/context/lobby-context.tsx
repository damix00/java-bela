"use client";

import { useRouter } from "next/navigation";
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import {
    LobbyPlayerStatus,
    MatchType,
    type Lobby,
    type LobbyPlayer,
} from "@bela/protocol";

import { useAuth } from "@/context/auth-context";
import { useSocket, type SocketError } from "@/context/socket-context";
import { useSocketErrors, useSocketEvent } from "@/hooks/use-socket-event";
import type { Locale } from "@/lib/i18n";
import { playPath } from "@/lib/routes";

/** `Lobby.MAX_PLAYERS`. Four seats, and the backend will not grow a fifth. */
export const SEAT_COUNT = 4;

/**
 * How long to let a reconnect's unprompted snapshot arrive before acting as
 * though there is no table.
 *
 * Both entry points need it. `LobbyReconnectService` re-sends
 * `lobby:initialState` for a player whose presence still names a lobby, and it
 * does so while the connection is still being established — so anything that
 * decides what to do *based on* whether you already have a table has to let
 * that land first, or it will create a second one or refuse to leave the first.
 */
export const SNAPSHOT_GRACE_MS = 600;

/** A seat is either occupied or open; the array is always `SEAT_COUNT` long. */
export type Seats = (LobbyPlayer | null)[];

type LobbyContextType = {
    lobby: Lobby | null;
    /** Indexed by seat, so `seats[2]` is seat 2 whether or not anyone is in it. */
    seats: Seats;
    /** The signed-in player's own seat, once they have one. */
    me: LobbyPlayer | null;
    isHost: boolean;
    isReady: boolean;
    playerCount: number;
    /** The last refusal from a `lobby:*` command, for the UI to explain. */
    error: SocketError | null;
    clearError: () => void;
    create: () => void;
    joinByCode: (inviteCode: string) => void;
    leave: () => void;
    setReady: (ready: boolean) => void;
    swapSeat: (seat: number) => void;
    setMatchType: (matchType: MatchType) => void;
};

/**
 * The target score a private table plays to.
 *
 * `GameConfiguration.forMatchType` reads this only for `PRIVATE` — ranked is
 * always 1001 and casual always 501, both fixed on the backend. 501 is what
 * `LobbyService` gives a new lobby, so sending it keeps the default the default
 * until there is a control for it.
 */
const PRIVATE_TARGET_SCORE = 501;

const LobbyContext = createContext<LobbyContextType | undefined>(undefined);

/** Immutably replace one seat, dropping the key when the seat empties. */
function withSeat(lobby: Lobby, seat: number, player: LobbyPlayer | null) {
    const playerSeats = { ...lobby.playerSeats };

    if (player) {
        playerSeats[seat] = player;
    } else {
        delete playerSeats[seat];
    }

    return { ...lobby, playerSeats };
}

/** The seat a given player occupies, or -1. */
function seatOf(lobby: Lobby, userId: string): number {
    const entry = Object.entries(lobby.playerSeats).find(
        ([, player]) => player.userId === userId,
    );

    return entry ? Number(entry[0]) : -1;
}

/**
 * The lobby, as the client sees it.
 *
 * There is no lobby REST endpoint to read — the backend keeps lobbies in Redis
 * and speaks about them only over the socket. So this holds the last snapshot
 * and patches it from the event stream, which is the whole of the client's
 * knowledge.
 *
 * Nothing here has to *ask* for the snapshot. `lobby:initialState` arrives
 * unprompted on create, on join, and again on every reconnect — the backend's
 * `LobbyReconnectService` sees the socket come back, notices the player's
 * presence still names a lobby, and re-sends it. Which is why a reload lands
 * back at the table without this ever issuing a command.
 */
export function LobbyProvider({
    children,
    locale,
}: {
    children: ReactNode;
    locale: Locale;
}) {
    const { user } = useAuth();
    const { send } = useSocket();
    const router = useRouter();

    const [lobby, setLobby] = useState<Lobby | null>(null);
    const [error, setError] = useState<SocketError | null>(null);

    const userId = user?.id ?? null;

    useSocketEvent("lobby:initialState", ({ lobby }) => {
        setError(null);
        setLobby(lobby);
    });

    useSocketEvent("lobby:playerJoined", ({ player }) => {
        setLobby((current) =>
            current ? withSeat(current, player.seat, player) : current,
        );
    });

    useSocketEvent("lobby:playerLeft", ({ userId: leaverId }) => {
        setLobby((current) => {
            if (!current) return current;

            // Defensive: the backend removes a leaver before it broadcasts, so
            // this normally never names us. An eviction could.
            if (leaverId === userId) return null;

            const seat = seatOf(current, leaverId);
            return seat === -1 ? current : withSeat(current, seat, null);
        });
    });

    useSocketEvent(
        "lobby:playerStatusChange",
        ({ userId: playerId, status }) => {
            setLobby((current) => {
                if (!current) return current;

                const seat = seatOf(current, playerId);
                if (seat === -1) return current;

                return withSeat(current, seat, {
                    ...current.playerSeats[seat],
                    status,
                });
            });
        },
    );

    useSocketEvent("lobby:hostUpdated", ({ newHostId }) => {
        setLobby((current) => {
            if (!current) return current;

            const playerSeats = Object.fromEntries(
                Object.entries(current.playerSeats).map(([seat, player]) => [
                    seat,
                    { ...player, host: player.userId === newHostId },
                ]),
            );

            return { ...current, playerSeats };
        });
    });

    useSocketEvent("lobby:configChanged", ({ configuration }) => {
        setLobby((current) =>
            current
                ? { ...current, gameConfiguration: configuration }
                : current,
        );
    });

    useSocketEvent("lobby:seatsUpdated", ({ userSeats }) => {
        setLobby((current) =>
            current ? { ...current, playerSeats: userSeats } : current,
        );
    });

    useSocketEvent("lobby:gameCreated", ({ game }) => {
        // The lobby's job ends here. Whatever the table becomes lives at its own
        // URL, and the lobby state stops being the thing on screen.
        setLobby(null);
        router.push(playPath(locale, game.id));
    });

    // Only this feature's refusals. A `game:*` failure is not the lobby's to
    // explain, and showing it beside a lobby control would be misdirection.
    useSocketErrors((incoming) => {
        if (incoming.command.startsWith("lobby:")) setError(incoming);
    });

    const seats = useMemo<Seats>(() => {
        const empty: Seats = Array.from({ length: SEAT_COUNT }, () => null);
        if (!lobby) return empty;

        return empty.map((_, seat) => lobby.playerSeats[seat] ?? null);
    }, [lobby]);

    const me = useMemo(
        () =>
            userId ? (seats.find((s) => s?.userId === userId) ?? null) : null,
        [seats, userId],
    );

    const clearError = useCallback(() => setError(null), []);

    const create = useCallback(() => {
        setError(null);
        send("lobby:create");
    }, [send]);

    const joinByCode = useCallback(
        (inviteCode: string) => {
            setError(null);
            send("lobby:join:code", { inviteCode });
        },
        [send],
    );

    const leave = useCallback(() => {
        send("lobby:leave");
        // Cleared here rather than on an event: the backend removes the leaver
        // before it broadcasts, so we are never told about our own departure.
        setLobby(null);
        setError(null);
    }, [send]);

    const setReady = useCallback(
        (ready: boolean) => send("lobby:ready", { ready }),
        [send],
    );

    const swapSeat = useCallback(
        (seat: number) => send("lobby:swapSeats", { seat }),
        [send],
    );

    const setMatchType = useCallback(
        (matchType: MatchType) =>
            // The command takes the match type as a loose string — the handler
            // upper-cases and parses it — and the points are only read for a
            // private table.
            send("lobby:changeConfig", {
                matchType,
                points: PRIVATE_TARGET_SCORE,
            }),
        [send],
    );

    return (
        <LobbyContext.Provider
            value={{
                lobby,
                seats,
                me,
                isHost: me?.host ?? false,
                isReady: me?.status === LobbyPlayerStatus.READY,
                playerCount: seats.filter(Boolean).length,
                error,
                clearError,
                create,
                joinByCode,
                leave,
                setReady,
                swapSeat,
                setMatchType,
            }}>
            {children}
        </LobbyContext.Provider>
    );
}

export function useLobby() {
    const context = useContext(LobbyContext);
    if (context === undefined) {
        throw new Error("useLobby must be used within a LobbyProvider");
    }
    return context;
}
