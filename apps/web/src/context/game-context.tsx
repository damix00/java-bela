"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import {
    GameStatus,
    RoundStatus,
    type Card,
    type Declaration,
    type PlayedCard,
    type Suite,
    type Team,
    type TeamSnapshot,
} from "@bela/protocol";

import { useSocketCommands } from "@/context/socket-context";
import { useSocketEvent } from "@/hooks/use-socket-event";
import { sameCard } from "@/lib/game/rules";
import { seatingFor, type GameSeating } from "@/lib/game/seats";

/**
 * The `ScheduledTaskType` names the backend puts in a snapshot's `timerType`.
 *
 * A reconnect has to rebuild whichever countdown was already running, and this
 * is the only thing that says which one it was. The names are the Java enum's,
 * so they are a wire contract even though the generator types the field as a
 * bare string.
 */
const TIMER = {
    trumpChoice: "CHOOSING_TRUMP_TIMEOUT_TASK",
    cardThrow: "CARD_THROW_TIMEOUT_TASK",
    declarations: "DECLARATIONS_COMPLETE_TASK",
    nextTrick: "NEXT_TRICK_START_TASK",
    nextRound: "ROUND_START_TASK",
} as const;

/**
 * The round in progress, as this client knows it.
 *
 * Not the generated `BeloteRound`: that describes the server's whole aggregate —
 * `roundPlayers`, both `RoundTeam`s, every past trick — and a snapshot carries
 * only `RoundSnapshot`'s much narrower slice. Composed out of protocol
 * primitives instead, so the parts that *are* on the wire keep their real types.
 */
export type RoundView = {
    roundNumber: number;
    roundStatus: RoundStatus;
    /** Absent until somebody calls. The generator cannot say "nullable". */
    trumpSuite: Suite | null;
    /** The seat that called trump. Snapshots do not currently carry it. */
    trumpCallerIndex: number | null;
    /** A seat index — every event calls this `playerIndex` or `currentTurnIndex`. */
    currentTurnIndex: number;
    currentTrickNumber: number;
    /** What is on the felt right now. */
    trickCards: PlayedCard[];
    /** Set once the trick is decided, `null` while it is still being played. */
    trickWinningPlayerIndex: number | null;
    team1RoundPoints: number;
    team2RoundPoints: number;
    team1Declarations: Declaration[];
    team2Declarations: Declaration[];
    declinedDeclarationSeats: number[];
};

export type GameView = {
    gameId: string;
    status: GameStatus;
    maxPoints: number;
    /** Identity and running totals. Hands are tracked separately. */
    team1: TeamSnapshot;
    team2: TeamSnapshot;
    /** My cards. Nobody else's are ever sent. */
    hand: Card[];
    /** Seat index to cards remaining, for drawing the other three hands face down. */
    counts: Record<number, number>;
    /** What I have already played this round — bela needs it. */
    myPlayedCards: Card[];
    round: RoundView | null;
};

/** A countdown, stored as its origin so a re-render never restarts the clock. */
export type Countdown = {
    timeoutSeconds: number;
    startedAt: number;
};

export type PendingBreak = Countdown & {
    kind: "trick" | "round";
    winningPlayerIndex: number | null;
};

export type GameResult = {
    team1FinalScore: number;
    team2FinalScore: number;
    winningTeamIndex: number;
};

/**
 * Where the round is, derived rather than stored.
 *
 * The reference client kept a `phase` in its own `useState` alongside the round
 * status it was computed from, and the two could disagree. There is only one
 * source of truth for this, so it is read rather than tracked.
 */
export type GamePhase =
    | "loading"
    | "waiting"
    | "dealing"
    | "choosing-trump"
    | "declarations"
    | "playing"
    | "round-over"
    | "finished";

type GameState = {
    game: GameView | null;
    phase: GamePhase;
    seating: GameSeating | null;
    /** My seat, or -1. Shorthand for `seating.chair`. */
    chair: number;
    /** Whose turn it is to act, and whether that is me. */
    isMyTurn: boolean;
    trumpCountdown: Countdown | null;
    /** The window in which zvanja may be declined, before the server resolves them. */
    declarationCountdown: Countdown | null;
    turnCountdown: Countdown | null;
    pendingBreak: PendingBreak | null;
    /**
     * Whether passing is still allowed. The fourth chooser must call ("mora").
     *
     * Counted from the skips seen this round, which a reconnect cannot recover —
     * a snapshot carries the current chooser but not who started. After a reload
     * this reads true and the backend refuses the pass if it was wrong, which is
     * the right authority for it anyway.
     */
    canPass: boolean;
    result: GameResult | null;
};

type GameActions = {
    /** The "I am on the game screen" handshake; the fourth one starts the game. */
    ready: () => void;
    chooseTrump: (suite: Suite) => void;
    passTrump: () => void;
    throwCard: (card: Card, declareBela?: boolean) => void;
    declineDeclarations: () => void;
};

/** Split for the reason `lobby-context.tsx` documents: different clocks. */
const GameStateContext = createContext<GameState | undefined>(undefined);
const GameActionsContext = createContext<GameActions | undefined>(undefined);

/**
 * `lobby:gameCreated` describes the game with the server's own `Team`, while
 * every later frame speaks in `TeamSnapshot`. Same four players either way, so
 * the difference is flattened here rather than carried through the state.
 *
 * `GamePlayer.hand` is not sanitised per player on this event the way a snapshot
 * is, so it is dropped on the floor — nothing is dealt yet at creation time, and
 * the real hand arrives with `game:roundStart`.
 */
function asSnapshotTeam(team: Team): TeamSnapshot {
    return {
        totalScore: team.totalScore,
        players: (team.players ?? []).map((player) => ({
            userId: player.userId,
            seatIndex: player.seatIndex,
            bot: player.bot,
            username: player.username,
            avatarUrl: player.avatarUrl,
            cardCount: 0,
            hand: [],
        })),
    };
}

/** Only the perspective player's `hand` is populated; everyone else gets a count. */
function readHands(team1: TeamSnapshot, team2: TeamSnapshot, userId: string) {
    const counts: Record<number, number> = {};
    let hand: Card[] = [];

    for (const team of [team1, team2]) {
        for (const player of team.players ?? []) {
            counts[player.seatIndex] = player.cardCount;

            if (player.userId === userId && player.hand) {
                hand = player.hand;
                counts[player.seatIndex] = player.hand.length;
            }
        }
    }

    return { hand, counts };
}

/** `-1` is the backend's "not yet" for both of these, not a seat. */
function optionalIndex(value: number | undefined | null) {
    return value === undefined || value === null || value < 0 ? null : value;
}

export function GameProvider({
    children,
    userId,
}: {
    children: ReactNode;
    /**
     * Read on the server and handed down, not pulled from `useAuth`.
     *
     * The token store is seeded in an effect, so context still says "signed out"
     * for a pass after hydration — and a `game:snapshot` can land in that window
     * on a reconnect, which is exactly when knowing whose hand it is matters.
     */
    userId: string | null;
}) {
    const { send } = useSocketCommands();

    const [game, setGame] = useState<GameView | null>(null);
    const [trumpCountdown, setTrumpCountdown] = useState<Countdown | null>(null);
    const [declarationCountdown, setDeclarationCountdown] =
        useState<Countdown | null>(null);
    const [turnCountdown, setTurnCountdown] = useState<Countdown | null>(null);
    const [pendingBreak, setPendingBreak] = useState<PendingBreak | null>(null);
    const [passCount, setPassCount] = useState(0);
    const [result, setResult] = useState<GameResult | null>(null);

    const clearCountdowns = useCallback(() => {
        setTrumpCountdown(null);
        setDeclarationCountdown(null);
        setTurnCountdown(null);
        setPendingBreak(null);
    }, []);

    /**
     * The game as it is dealt into existence.
     *
     * This is the *only* thing that seeds a game on the normal path — a
     * `game:snapshot` is sent on reconnect, not on creation — so without it the
     * play screen mounts with nothing, decides the table is gone and sends the
     * player straight back to the lobby.
     *
     * `LobbyProvider` listens to the same event to do the routing. Two listeners
     * on one frame is deliberate: the lobby owns where the player goes, the game
     * owns what is waiting when they get there.
     */
    useSocketEvent("lobby:gameCreated", ({ game }) => {
        clearCountdowns();
        setResult(null);
        setPassCount(0);

        setGame({
            gameId: game.id,
            status: game.status,
            maxPoints: game.maxPoints,
            team1: asSnapshotTeam(game.team1),
            team2: asSnapshotTeam(game.team2),
            hand: [],
            counts: {},
            myPlayedCards: [],
            round: null,
        });
    });

    /**
     * The whole state, rebuilt. Arrives unprompted on every reconnect —
     * `GameReconnectService` pushes it the moment the socket comes back, before
     * anything here could think to ask.
     */
    useSocketEvent("game:snapshot", (data) => {
        // The event names its own perspective, which is more reliable than the
        // prop: this frame can arrive on a reconnect before the token store has
        // been seeded, and it is the server's own answer to "whose hand is this".
        const self = data.perspectiveUserId || userId || "";
        const { hand, counts } = readHands(data.team1, data.team2, self);
        const snapshot = data.currentRound;
        const mySeat = [data.team1, data.team2]
            .flatMap((team) => team.players ?? [])
            .find((player) => player.userId === self)?.seatIndex;

        const round: RoundView | null = snapshot
            ? {
                  roundNumber: snapshot.roundNumber,
                  roundStatus: snapshot.roundStatus,
                  trumpSuite: snapshot.trumpSuite ?? null,
                  trumpCallerIndex: optionalIndex(snapshot.trumpCallerIndex),
                  currentTurnIndex: snapshot.currentTurnIndex,
                  currentTrickNumber: snapshot.currentTrickNumber,
                  trickCards: snapshot.currentTrickCards ?? [],
                  trickWinningPlayerIndex: optionalIndex(
                      snapshot.currentTrickWinningPlayerIndex,
                  ),
                  team1RoundPoints: snapshot.team1RoundPoints,
                  team2RoundPoints: snapshot.team2RoundPoints,
                  team1Declarations: snapshot.team1Declarations ?? [],
                  team2Declarations: snapshot.team2Declarations ?? [],
                  declinedDeclarationSeats:
                      snapshot.declinedDeclarationSeats ?? [],
              }
            : null;

        setGame({
            gameId: data.gameId,
            status: data.status,
            maxPoints: data.maxPoints,
            team1: data.team1,
            team2: data.team2,
            hand,
            counts,
            // Earlier tricks are not in a snapshot, so the only cards of mine we
            // can recover are the ones still on the felt. Bela may therefore go
            // unoffered for a pair split across a reload — it costs 20 points in
            // a rare case, and inventing the rest would be worse.
            myPlayedCards: (snapshot?.currentTrickCards ?? [])
                .filter((played) => played.playerIndex === mySeat)
                .map((played) => played.card),
            round,
        });

        // Rebuild whichever countdown the server says is running, at the point
        // it has actually reached. Durations are never assumed here.
        const timerType = snapshot?.timerType ?? null;
        const remaining = snapshot?.timeoutSeconds ?? null;
        const startedAt = Date.now();

        setTrumpCountdown(
            round?.roundStatus === RoundStatus.CHOOSING_TRUMP
                ? { timeoutSeconds: remaining ?? 0, startedAt }
                : null,
        );

        setDeclarationCountdown(
            timerType === TIMER.declarations && remaining !== null
                ? { timeoutSeconds: remaining, startedAt }
                : null,
        );

        setTurnCountdown(
            timerType === TIMER.cardThrow && remaining !== null
                ? { timeoutSeconds: remaining, startedAt }
                : null,
        );

        setPendingBreak(
            (timerType === TIMER.nextTrick || timerType === TIMER.nextRound) &&
                remaining !== null
                ? {
                      kind:
                          timerType === TIMER.nextTrick ? "trick" : "round",
                      winningPlayerIndex:
                          round?.trickWinningPlayerIndex ?? null,
                      timeoutSeconds: remaining,
                      startedAt,
                  }
                : null,
        );
    });

    useSocketEvent("game:roundStart", (data) => {
        clearCountdowns();
        setPassCount(0);

        setGame((prev) => {
            if (!prev) return prev;

            // Everyone is dealt the same number, so my own hand sizes the rest.
            // Read off the seats rather than off the previous counts: at the
            // first round those are all still zero from `lobby:gameCreated`, and
            // iterating them would have left every hand empty for the whole game.
            const counts: Record<number, number> = {};
            for (const team of [prev.team1, prev.team2]) {
                for (const player of team.players ?? []) {
                    counts[player.seatIndex] = data.hand.length;
                }
            }

            return {
                ...prev,
                hand: data.hand,
                counts,
                myPlayedCards: [],
                round: {
                    roundNumber: data.roundNumber,
                    roundStatus: data.roundStatus,
                    trumpSuite: null,
                    trumpCallerIndex: null,
                    currentTurnIndex: data.currentTurnIndex,
                    currentTrickNumber: -1,
                    trickCards: [],
                    trickWinningPlayerIndex: null,
                    team1RoundPoints: data.team1RoundPoints,
                    team2RoundPoints: data.team2RoundPoints,
                    team1Declarations: [],
                    team2Declarations: [],
                    declinedDeclarationSeats: [],
                },
            };
        });
    });

    useSocketEvent("game:trumpChoosingStarted", (data) => {
        setTurnCountdown(null);
        setDeclarationCountdown(null);
        setPendingBreak(null);
        setTrumpCountdown({
            timeoutSeconds: data.timeoutSeconds,
            startedAt: Date.now(),
        });

        setGame((prev) =>
            prev?.round?.roundNumber === data.roundNumber
                ? {
                      ...prev,
                      round: {
                          ...prev.round,
                          roundStatus: RoundStatus.CHOOSING_TRUMP,
                          currentTurnIndex: data.currentTurnIndex,
                      },
                  }
                : prev,
        );
    });

    useSocketEvent("game:trumpChoiceSkipped", (data) => {
        setPassCount((count) => count + 1);
        setTrumpCountdown({
            timeoutSeconds: data.timeoutSeconds,
            startedAt: Date.now(),
        });

        setGame((prev) =>
            prev?.round?.roundNumber === data.roundNumber
                ? {
                      ...prev,
                      round: {
                          ...prev.round,
                          currentTurnIndex: data.nextTurnIndex,
                      },
                  }
                : prev,
        );
    });

    useSocketEvent("game:trumpChosen", (data) => {
        clearCountdowns();

        // Zvanja are shown for a fixed window the server owns; it carries the
        // length here so the tray can count the same seconds down.
        if (data.roundStatus === RoundStatus.DECLARATIONS) {
            setDeclarationCountdown({
                timeoutSeconds: data.timeoutSeconds,
                startedAt: Date.now(),
            });
        }

        setGame((prev) => {
            if (!prev || prev.round?.roundNumber !== data.roundNumber) {
                return prev;
            }

            // `hand` is the authoritative re-send for the perspective player. The
            // merge is the fallback for a frame that carried only the two cards
            // the call just turned face up.
            const hand = data.hand?.length
                ? data.hand
                : [
                      ...prev.hand,
                      ...(data.revealedCards ?? []).filter(
                          (revealed) =>
                              !prev.hand.some((card) =>
                                  sameCard(card, revealed),
                              ),
                      ),
                  ].map((card) => ({
                      ...card,
                      hidden: false,
                      trump: card.suite === data.trumpSuite,
                  }));

            // Calling trump turns the last two of everyone's deal face up, so
            // every hand grows by the same amount at the same moment. Without
            // this the seat plates kept reporting the six they were dealt while
            // the hand below them showed eight.
            const counts: Record<number, number> = {};
            for (const team of [prev.team1, prev.team2]) {
                for (const player of team.players ?? []) {
                    counts[player.seatIndex] = hand.length;
                }
            }

            return {
                ...prev,
                hand,
                counts,
                team1: { ...prev.team1, totalScore: data.team1TotalScore },
                team2: { ...prev.team2, totalScore: data.team2TotalScore },
                round: {
                    ...prev.round,
                    roundStatus: data.roundStatus,
                    trumpSuite: data.trumpSuite,
                    trumpCallerIndex: data.chosenByTurnIndex,
                    currentTurnIndex: data.currentTurnIndex,
                    team1RoundPoints: data.team1RoundPoints,
                    team2RoundPoints: data.team2RoundPoints,
                    team1Declarations: data.team1Declarations ?? [],
                    team2Declarations: data.team2Declarations ?? [],
                },
            };
        });
    });

    useSocketEvent("game:cardTurnStarted", (data) => {
        setPendingBreak(null);
        setDeclarationCountdown(null);
        setTurnCountdown({
            timeoutSeconds: data.timeoutSeconds,
            startedAt: Date.now(),
        });

        setGame((prev) => {
            if (!prev || prev.round?.roundNumber !== data.roundNumber) {
                return prev;
            }

            // A fresh trick clears the felt; the same trick number arriving twice
            // must not.
            const isNewTrick = prev.round.currentTrickNumber !== data.trickNumber;

            return {
                ...prev,
                round: {
                    ...prev.round,
                    roundStatus: RoundStatus.PLAYING,
                    currentTurnIndex: data.currentTurnIndex,
                    currentTrickNumber: data.trickNumber,
                    trickCards: isNewTrick ? [] : prev.round.trickCards,
                    trickWinningPlayerIndex: isNewTrick
                        ? null
                        : prev.round.trickWinningPlayerIndex,
                },
            };
        });
    });

    useSocketEvent("game:cardThrown", (data) => {
        if (data.trickComplete) {
            // A completed trick keeps its cards on the felt for the break, so the
            // turn clock stops rather than counting down against nobody.
            setTurnCountdown(null);
            setPendingBreak({
                kind: data.nextTrickPending ? "trick" : "round",
                winningPlayerIndex: optionalIndex(data.winningPlayerIndex),
                timeoutSeconds: data.pendingDelaySeconds,
                startedAt: Date.now(),
            });
        } else {
            setPendingBreak(null);
            setTurnCountdown({
                timeoutSeconds: data.timeoutSeconds,
                startedAt: Date.now(),
            });
        }

        setGame((prev) => {
            if (!prev || prev.round?.roundNumber !== data.roundNumber) {
                return prev;
            }

            const mine = data.playerIndex === selfSeat(prev, userId);
            const alreadyOnFelt = prev.round.trickCards.some(
                (played) =>
                    played.playerIndex === data.playerIndex &&
                    sameCard(played.card, data.card),
            );

            return {
                ...prev,
                hand: mine
                    ? prev.hand.filter((card) => !sameCard(card, data.card))
                    : prev.hand,
                myPlayedCards: mine
                    ? [...prev.myPlayedCards, data.card]
                    : prev.myPlayedCards,
                counts: {
                    ...prev.counts,
                    [data.playerIndex]: Math.max(
                        0,
                        (prev.counts[data.playerIndex] ?? 0) - 1,
                    ),
                },
                team1: { ...prev.team1, totalScore: data.team1TotalScore },
                team2: { ...prev.team2, totalScore: data.team2TotalScore },
                round: {
                    ...prev.round,
                    // A thrown card *is* play, so this is what moves the round
                    // out of DECLARATIONS — not `game:cardTurnStarted`, which
                    // `TrumpPhaseService.publishFirstCardTurnOrSchedule` sends
                    // only when the player to lead is human. With a bot leading
                    // the trick nothing announced the phase change, and the
                    // table sat on the declarations panel with a dimmed hand
                    // while the bots played the round out.
                    roundStatus:
                        data.trickComplete && !data.nextTrickPending
                            ? RoundStatus.FINISHED
                            : RoundStatus.PLAYING,
                    currentTurnIndex: data.nextTurnIndex,
                    currentTrickNumber: data.trickNumber,
                    trickCards: alreadyOnFelt
                        ? prev.round.trickCards
                        : [
                              ...prev.round.trickCards,
                              {
                                  playerIndex: data.playerIndex,
                                  card: data.card,
                              },
                          ],
                    trickWinningPlayerIndex: data.trickComplete
                        ? optionalIndex(data.winningPlayerIndex)
                        : prev.round.trickWinningPlayerIndex,
                    team1RoundPoints: data.team1RoundPoints,
                    team2RoundPoints: data.team2RoundPoints,
                },
            };
        });
    });

    useSocketEvent("game:statusChanged", (data) => {
        setGame((prev) =>
            prev ? { ...prev, status: data.gameStatus } : prev,
        );
    });

    useSocketEvent("game:ended", (data) => {
        clearCountdowns();
        setResult({
            team1FinalScore: data.team1FinalScore,
            team2FinalScore: data.team2FinalScore,
            winningTeamIndex: data.winningTeamIndex,
        });

        setGame((prev) =>
            prev
                ? {
                      ...prev,
                      status: data.gameStatus,
                      team1: { ...prev.team1, totalScore: data.team1FinalScore },
                      team2: { ...prev.team2, totalScore: data.team2FinalScore },
                  }
                : prev,
        );
    });

    const seating = useMemo(
        () => (game ? seatingFor(game.team1, game.team2, userId) : null),
        [game, userId],
    );

    const phase = useMemo<GamePhase>(() => {
        if (!game) return "loading";
        if (game.status === GameStatus.FINISHED) return "finished";
        if (game.status === GameStatus.WAITING) return "waiting";
        if (!game.round) return "dealing";

        switch (game.round.roundStatus) {
            case RoundStatus.CHOOSING_TRUMP:
                return "choosing-trump";
            case RoundStatus.DECLARATIONS:
                return "declarations";
            case RoundStatus.PLAYING:
                return "playing";
            default:
                return "round-over";
        }
    }, [game]);

    const ready = useCallback(() => send("game:loaded"), [send]);

    const chooseTrump = useCallback(
        (suite: Suite) => send("game:trump:choose", { suite }),
        [send],
    );

    const passTrump = useCallback(() => send("game:trump:pass"), [send]);

    const throwCard = useCallback(
        (card: Card, declareBela = false) =>
            send("game:card:throw", {
                suite: card.suite,
                rank: card.rank,
                declareBela,
            }),
        [send],
    );

    const declineDeclarations = useCallback(
        // The backend answers with a fresh snapshot, so nothing is patched here.
        () => send("game:declarations:decline"),
        [send],
    );

    const state = useMemo<GameState>(() => {
        const chair = seating?.chair ?? -1;

        return {
            game,
            phase,
            seating,
            chair,
            isMyTurn:
                chair !== -1 && game?.round?.currentTurnIndex === chair,
            trumpCountdown,
            declarationCountdown,
            turnCountdown,
            pendingBreak,
            canPass: passCount < 3,
            result,
        };
    }, [
        game,
        phase,
        seating,
        trumpCountdown,
        declarationCountdown,
        turnCountdown,
        pendingBreak,
        passCount,
        result,
    ]);

    const actions = useMemo<GameActions>(
        () => ({
            ready,
            chooseTrump,
            passTrump,
            throwCard,
            declineDeclarations,
        }),
        [ready, chooseTrump, passTrump, throwCard, declineDeclarations],
    );

    return (
        <GameActionsContext.Provider value={actions}>
            <GameStateContext.Provider value={state}>
                {children}
            </GameStateContext.Provider>
        </GameActionsContext.Provider>
    );
}

/** My seat index within a given view, or -1. */
function selfSeat(game: GameView, userId: string | null) {
    if (!userId) return -1;

    for (const team of [game.team1, game.team2]) {
        for (const player of team.players ?? []) {
            if (player.userId === userId) return player.seatIndex;
        }
    }

    return -1;
}

/** What the game is. Re-renders the caller on every `game:*` frame. */
export function useGame() {
    const context = useContext(GameStateContext);
    if (context === undefined) {
        throw new Error("useGame must be used within a GameProvider");
    }
    return context;
}

/** What can be done, without subscribing to what the game currently is. */
export function useGameActions() {
    const context = useContext(GameActionsContext);
    if (context === undefined) {
        throw new Error("useGameActions must be used within a GameProvider");
    }
    return context;
}
