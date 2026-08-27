"use client";

import { useRouter } from "next/navigation";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import {
    LobbyPlayerStatus,
    LobbyStatus,
    MatchType,
    type Lobby,
    type LobbyPlayer,
} from "@bela/protocol";

import { useAuth } from "@/context/auth-context";
import {
    useSocketCommands,
    useSocketSession,
    type SocketError,
} from "@/context/socket-context";
import { useSocketErrors, useSocketEvent } from "@/hooks/use-socket-event";
import type { Locale } from "@/lib/i18n/config";
import { playPath } from "@/lib/navigation/routes";

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

/** What the table currently *is*. Changes whenever a `lobby:*` frame lands. */
type LobbyState = {
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
};

/** What can be *done* to the table. Stable for the life of the provider. */
type LobbyActions = {
    clearError: () => void;
    create: () => void;
    joinByCode: (inviteCode: string) => void;
    leave: () => void;
    setReady: (ready: boolean) => void;
    swapSeat: (seat: number) => void;
    /**
     * The target score is read by the backend for `PRIVATE` and ignored for the
     * other two, so ranked and casual call sites pass nothing.
     */
    setMatchType: (matchType: MatchType, points?: number) => void;
};

/**
 * The target score a private table starts on.
 *
 * `GameConfiguration.forMatchType` reads this only for `PRIVATE` — ranked is
 * always 1001 and casual always 501, both fixed on the backend. 501 is also
 * what `LobbyService` gives a new lobby, so a table that arrives at Private
 * without anyone touching the score keeps the value it already had.
 */
export const PRIVATE_TARGET_SCORE = 501;

/**
 * What a private table can play to.
 *
 * The backend accepts any `targetScore > 0`, so this is a client-side offer
 * rather than a constraint — the four lengths a belote night is actually played
 * at, from a quick 301 to the full 1001 that ranked uses.
 */
export const PRIVATE_TARGET_SCORES = [301, 501, 701, 1001] as const;

/**
 * Split for the same reason the socket's is: the two halves change on different
 * clocks, and behind one value the slower half is dragged along by the faster.
 *
 * Every `lobby:*` frame rebuilds the state — a ready toggle, a seat swap, a
 * keepalive-era reconnect snapshot. The actions never change. Held together, a
 * component that only wanted `setMatchType` re-rendered on all of it.
 */
const LobbyStateContext = createContext<LobbyState | undefined>(undefined);

const LobbyActionsContext = createContext<LobbyActions | undefined>(undefined);

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
    // Commands only. Taking the status here would re-render this provider — and
    // so every table under it — on each step of a reconnect backoff.
    const { send } = useSocketCommands();
    // Only the moment the line was remade, which is when what we hold has to be
    // reconsidered. The status itself moves on every backoff step and would
    // re-render this provider — and so the whole table — for each of them.
    const openedAt = useSocketSession();
    const router = useRouter();

    const [lobby, setLobby] = useState<Lobby | null>(null);
    const [error, setError] = useState<SocketError | null>(null);

    const userId = user?.id ?? null;

    /** When the last snapshot landed, so a session can tell if one was for it. */
    const snapshotAt = useRef(0);

    useSocketEvent("lobby:initialState", ({ lobby }) => {
        snapshotAt.current = Date.now();
        setError(null);
        setLobby(lobby);

        /**
         * A table that is already playing sends you to it.
         *
         * This snapshot arrives unprompted on every reconnect — `LobbyReconnectService`
         * sees the socket come back, finds the player's presence still naming a
         * lobby, and re-sends it. Without this branch a player who reloaded
         * mid-game landed on the lobby screen and stayed there, looking at four
         * seats for a game that was carrying on without them.
         *
         * `LobbyService.createGame` sets both fields together, so a lobby that
         * says IN_GAME always has the id to route to.
         *
         * `replace`, not `push`: the lobby being left is not somewhere Back
         * should be able to return to.
         */
        if (lobby.status === LobbyStatus.IN_GAME && lobby.gameId) {
            router.replace(playPath(locale, lobby.gameId));
        }
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

    useSocketEvent("lobby:gameCreated", ({ lobby, game }) => {
        // Keep the lobby rather than clearing it, even though the screen is
        // about to change. Clearing it left `TableScreen` mounted for the frames
        // before the route resolved, with no table and its create-on-arrival
        // timer running — which fired, was refused ("already in lobby", the game
        // having just claimed it), and flashed the session-locked modal over a
        // game that was starting perfectly well.
        //
        // The event carries the lobby in its IN_GAME state, so holding it makes
        // this path identical to the reconnect one below: same state, same
        // route, one way of getting there.
        setLobby(lobby);
        router.push(playPath(locale, game.id));
    });

    // Only this feature's refusals. A `game:*` failure is not the lobby's to
    // explain, and showing it beside a lobby control would be misdirection.
    useSocketErrors((incoming) => {
        if (!incoming.command.startsWith("lobby:")) return;

        // A create retry can already be in flight when its successful attempt
        // delivers the lobby snapshot. Any later refusal belongs to that stale
        // retry, not to the table now on screen.
        if (incoming.command === "lobby:create" && lobby) return;

        setError(incoming);
    });

    /**
     * A reconnect that brings no snapshot means the table is gone.
     *
     * `LobbyReconnectService` re-sends `lobby:initialState` for a player whose
     * presence still names a lobby, so silence here is an answer: the keepalive
     * lapsed while the tab was in the background, the backend's session TTL ran
     * out, and `LobbyEvictionService` took the seat back. Holding the last
     * snapshot at that point draws four chairs with people in them who are not
     * there — and, worse, stops `TableScreen` opening a new table, because it
     * stands down for as long as it believes there is one.
     *
     * The wait is the same grace the create-on-arrival path uses, and for the
     * same reason: the snapshot travels a round trip behind the handshake.
     * Comparing against `openedAt` rather than the moment this effect runs is
     * what makes it safe — a snapshot that beats React's render still counts as
     * belonging to this session.
     */
    useEffect(() => {
        if (!openedAt) return;

        const id = setTimeout(() => {
            if (snapshotAt.current < openedAt) setLobby(null);
        }, SNAPSHOT_GRACE_MS);

        return () => clearTimeout(id);
    }, [openedAt]);

    // Keyed on `playerSeats`, not on `lobby`. The two are not the same trigger:
    // `lobby:configChanged` rebuilds the lobby object and leaves `playerSeats`
    // untouched, and keying on the whole lobby handed out a brand new array for
    // it anyway — which invalidates every memo downstream that is watching the
    // seats, and re-renders four chairs because the match type changed.
    const playerSeats = lobby?.playerSeats;

    const seats = useMemo<Seats>(() => {
        const empty: Seats = Array.from({ length: SEAT_COUNT }, () => null);
        if (!playerSeats) return empty;

        return empty.map((_, seat) => playerSeats[seat] ?? null);
    }, [playerSeats]);

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
        (matchType: MatchType, points: number = PRIVATE_TARGET_SCORE) =>
            // The command takes the match type as a loose string — the handler
            // upper-cases and parses it — and the points are only read for a
            // private table.
            send("lobby:changeConfig", { matchType, points }),
        [send],
    );

    const state = useMemo<LobbyState>(
        () => ({
            lobby,
            seats,
            me,
            isHost: me?.host ?? false,
            isReady: me?.status === LobbyPlayerStatus.READY,
            playerCount: seats.filter(Boolean).length,
            error,
        }),
        [lobby, seats, me, error],
    );

    // Built once: each of these is a `useCallback` over `send`, which is itself
    // stable for the life of the socket provider.
    const actions = useMemo<LobbyActions>(
        () => ({
            clearError,
            create,
            joinByCode,
            leave,
            setReady,
            swapSeat,
            setMatchType,
        }),
        [
            clearError,
            create,
            joinByCode,
            leave,
            setReady,
            swapSeat,
            setMatchType,
        ],
    );

    return (
        <LobbyActionsContext.Provider value={actions}>
            <LobbyStateContext.Provider value={state}>
                {children}
            </LobbyStateContext.Provider>
        </LobbyActionsContext.Provider>
    );
}

/** What the table is. Re-renders the caller on every `lobby:*` frame. */
export function useLobby() {
    const context = useContext(LobbyStateContext);
    if (context === undefined) {
        throw new Error("useLobby must be used within a LobbyProvider");
    }
    return context;
}

/**
 * What can be done to the table, without subscribing to what it currently is.
 *
 * A control that only sends commands — a leave button, a rule selector — should
 * take this and nothing else, and then it re-renders for its own reasons rather
 * than for everyone else's.
 */
export function useLobbyActions() {
    const context = useContext(LobbyActionsContext);
    if (context === undefined) {
        throw new Error("useLobbyActions must be used within a LobbyProvider");
    }
    return context;
}
