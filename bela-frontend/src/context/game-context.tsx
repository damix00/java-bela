"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { useWebSocket } from "./ws-context";
import { useWsEvent } from "@/hooks/ws/use-event";
import { useLobby } from "./lobby-context";
import { useAuth } from "./auth-context";
import {
    BeloteGame,
    BeloteRound,
    Card,
    GameStatus,
    PlayedCard,
    RoundStatus,
    Suite,
    Team,
    Trick,
} from "@/types/game";
import { LobbyStatus } from "@/types/lobby";

type GameSnapshotData = {
    gameId: string;
    status: GameStatus;
    maxPoints: number;
    team1: Team;
    team2: Team;
    currentRound: {
        roundNumber: number;
        roundStatus: RoundStatus;
        trumpSuite: Suite | null;
        currentTurnIndex: number;
        currentTrickNumber: number;
        currentTrickCards: PlayedCard[];
        team1RoundPoints: number;
        team2RoundPoints: number;
    } | null;
};

type LobbyGameCreatedData = {
    game: BeloteGame;
};

type RoundStartData = {
    roundNumber: number;
    roundStatus: RoundStatus;
    currentTurnIndex: number;
    hand: Card[];
    team1RoundPoints: number;
    team2RoundPoints: number;
};

type TrumpChoosingStartedData = {
    roundNumber: number;
    currentTurnIndex: number;
    timeoutSeconds: number;
};

type TrumpChoiceSkippedData = {
    roundNumber: number;
    skippedTurnIndex: number;
    nextTurnIndex: number;
    timeoutSeconds: number;
};

type TrumpChosenData = {
    roundNumber: number;
    chosenByTurnIndex: number;
    trumpSuite: Suite;
    roundStatus: RoundStatus;
    hand: Card[];
    revealedCards: Card[];
};

type CardTurnStartedData = {
    roundNumber: number;
    trickNumber: number;
    currentTurnIndex: number;
    timeoutSeconds: number;
};

type CardThrownData = {
    roundNumber: number;
    trickNumber: number;
    playerIndex: number;
    card: Card;
    expired: boolean;
    trickComplete: boolean;
    nextTrickPending: boolean;
    winningPlayerIndex: number | null;
    nextTurnIndex: number;
    timeoutSeconds: number;
    team1RoundPoints: number;
    team2RoundPoints: number;
    team1TotalScore: number;
    team2TotalScore: number;
};

export type GamePhase =
    | "loading"
    | "countdown"
    | "round_starting"
    | "playing"
    | "finished";

export type TrumpChoiceState = {
    roundNumber: number;
    currentTurnIndex: number;
    timeoutSeconds: number;
    startedAt: number;
} | null;

export type TurnTimerState = {
    roundNumber: number;
    trickNumber: number;
    currentTurnIndex: number;
    timeoutSeconds: number;
    startedAt: number;
} | null;

export type NextTrickPendingState = {
    kind: "trick" | "round";
    roundNumber: number;
    completedTrickNumber: number;
    winningPlayerIndex: number | null;
    timeoutSeconds: number;
    startedAt: number;
} | null;

type GameContextType = {
    game: BeloteGame | null;
    phase: GamePhase;
    trumpChoice: TrumpChoiceState;
    turnTimer: TurnTimerState;
    nextTrickPending: NextTrickPendingState;
    setPhase: (phase: GamePhase) => void;
    chooseTrump: (suite: Suite) => void;
    passTrump: () => void;
    throwCard: (card: Card) => void;
};

const GameContext = createContext<GameContextType>({
    game: null,
    phase: "loading",
    trumpChoice: null,
    turnTimer: null,
    nextTrickPending: null,
    setPhase: () => {},
    chooseTrump: () => {},
    passTrump: () => {},
    throwCard: () => {},
});

function sameCard(a: Card, b: Card) {
    return a.suite === b.suite && a.rank === b.rank;
}

function applyTrumpToCard(card: Card, trumpSuite: Suite): Card {
    return {
        ...card,
        hidden: false,
        trump: card.suite === trumpSuite,
    };
}

function updateRoundInHistory(rounds: BeloteRound[], currentRound: BeloteRound) {
    const existingRoundIndex = rounds.findIndex(
        (round) => round.roundNumber === currentRound.roundNumber,
    );

    if (existingRoundIndex === -1) {
        return [...rounds, currentRound];
    }

    return rounds.map((round) =>
        round.roundNumber === currentRound.roundNumber ? currentRound : round,
    );
}

function updateTeamHandsForThrownCard(
    team: Team,
    playerIndex: number,
    card: Card,
): Team {
    return {
        ...team,
        players: team.players.map((player) =>
            player.seatIndex === playerIndex
                ? {
                      ...player,
                      hand: (player.hand ?? []).filter(
                          (handCard) => !sameCard(handCard, card),
                      ),
                  }
                : player,
        ),
    };
}

function upsertPlayedCard(trick: Trick, playedCard: PlayedCard) {
    const alreadyExists = trick.playedCards.some(
        (entry) =>
            entry.playerIndex === playedCard.playerIndex &&
            sameCard(entry.card, playedCard.card),
    );

    if (alreadyExists) {
        return trick.playedCards;
    }

    return [...trick.playedCards, playedCard];
}

function updateTrickInHistory(tricks: Trick[], currentTrick: Trick) {
    const existingTrickIndex = tricks.findIndex(
        (trick) => trick.trickNumber === currentTrick.trickNumber,
    );

    if (existingTrickIndex === -1) {
        return [...tricks, currentTrick];
    }

    return tricks.map((trick) =>
        trick.trickNumber === currentTrick.trickNumber ? currentTrick : trick,
    );
}

function normalizeSnapshotRound(
    round: GameSnapshotData["currentRound"],
): BeloteRound | null {
    if (!round) {
        return null;
    }

    const currentTrick =
        round.currentTrickNumber >= 0
            ? {
                  trickNumber: round.currentTrickNumber,
                  playedCards: round.currentTrickCards ?? [],
                  winningPlayerIndex: -1,
                  complete: false,
              }
            : null;

    return {
        roundNumber: round.roundNumber,
        roundStatus: round.roundStatus,
        trumpSuite: round.trumpSuite,
        currentTurnIndex: round.currentTurnIndex,
        currentTrickNumber: round.currentTrickNumber,
        team1RoundPoints: round.team1RoundPoints,
        team2RoundPoints: round.team2RoundPoints,
        tricks: currentTrick ? [currentTrick] : [],
        currentTrick,
    };
}

export function GameProvider({ children }: { children: ReactNode }) {
    const ws = useWebSocket();
    const { lobby } = useLobby();
    const { user } = useAuth();
    const [game, setGame] = useState<BeloteGame | null>(null);
    const [phase, setPhase] = useState<GamePhase>("loading");
    const [trumpChoice, setTrumpChoice] = useState<TrumpChoiceState>(null);
    const [turnTimer, setTurnTimer] = useState<TurnTimerState>(null);
    const [nextTrickPending, setNextTrickPending] =
        useState<NextTrickPendingState>(null);

    useWsEvent<LobbyGameCreatedData>("lobby:gameCreated", (data) => {
        console.log("Game created for game context:", data);
        setGame(data.game);
    });

    useWsEvent<GameSnapshotData>("game:snapshot", (data) => {
        console.log("Game snapshot received:", data);
        const currentRound = normalizeSnapshotRound(data.currentRound);
        setNextTrickPending(null);

        setGame({
            id: data.gameId,
            team1: data.team1,
            team2: data.team2,
            maxPoints: data.maxPoints,
            status: data.status,
            currentRoundNumber: currentRound?.roundNumber ?? -1,
            rounds: [],
            currentRound,
        });

        if (data.status === GameStatus.IN_PROGRESS) {
            setPhase("playing");
        }
    });

    useWsEvent<RoundStartData>("game:roundStart", (data) => {
        console.log("Round started:", data);
        setTurnTimer(null);
        setNextTrickPending(null);

        setGame((prev) => {
            if (!prev) return prev;

            const currentRound: BeloteRound = {
                roundNumber: data.roundNumber,
                roundStatus: data.roundStatus,
                trumpSuite: null,
                currentTurnIndex: data.currentTurnIndex,
                currentTrickNumber: -1,
                team1RoundPoints: data.team1RoundPoints,
                team2RoundPoints: data.team2RoundPoints,
                tricks: [],
                currentTrick: null,
            };

            const updateTeamHands = (team: Team): Team => ({
                ...team,
                players: team.players.map((player) => ({
                    ...player,
                    hand:
                        player.userId === user?.id
                            ? data.hand
                            : (player.hand ?? []),
                })),
            });

            return {
                ...prev,
                currentRoundNumber: data.roundNumber,
                currentRound,
                rounds: [...prev.rounds, currentRound],
                team1: updateTeamHands(prev.team1),
                team2: updateTeamHands(prev.team2),
            };
        });

        console.log(data.roundStatus);

        setPhase("round_starting");
    });

    useWsEvent<TrumpChoosingStartedData>("game:trumpChoosingStarted", (data) => {
        setTurnTimer(null);
        setNextTrickPending(null);
        setTrumpChoice({
            roundNumber: data.roundNumber,
            currentTurnIndex: data.currentTurnIndex,
            timeoutSeconds: data.timeoutSeconds,
            startedAt: Date.now(),
        });

        setGame((prev) =>
            prev?.currentRound?.roundNumber === data.roundNumber
                ? {
                      ...prev,
                      currentRound: {
                          ...prev.currentRound,
                          currentTurnIndex: data.currentTurnIndex,
                      },
                  }
                : prev,
        );
        setPhase("playing");
    });

    useWsEvent<TrumpChoiceSkippedData>("game:trumpChoiceSkipped", (data) => {
        setTrumpChoice({
            roundNumber: data.roundNumber,
            currentTurnIndex: data.nextTurnIndex,
            timeoutSeconds: data.timeoutSeconds,
            startedAt: Date.now(),
        });

        setGame((prev) =>
            prev?.currentRound?.roundNumber === data.roundNumber
                ? {
                      ...prev,
                      currentRound: {
                          ...prev.currentRound,
                          currentTurnIndex: data.nextTurnIndex,
                      },
                  }
                : prev,
        );
    });

    useWsEvent<TrumpChosenData>("game:trumpChosen", (data) => {
        setTrumpChoice(null);
        setTurnTimer(null);
        setNextTrickPending(null);

        setGame((prev) => {
            if (!prev || prev.currentRound?.roundNumber !== data.roundNumber) {
                return prev;
            }

            const updateTeamHands = (team: Team): Team => ({
                ...team,
                players: team.players.map((player) => {
                    if (player.userId !== user?.id) {
                        return player;
                    }

                    const existing = player.hand ?? [];
                    const merged = [
                        ...existing.map((card) =>
                            applyTrumpToCard(card, data.trumpSuite),
                        ),
                        ...data.revealedCards
                            .filter(
                                (revealed) =>
                                    !existing.some((card) =>
                                        sameCard(card, revealed),
                                    ),
                            )
                            .map((card) =>
                                applyTrumpToCard(card, data.trumpSuite),
                            ),
                    ];

                    return {
                        ...player,
                        hand: data.hand?.length ? data.hand : merged,
                    };
                }),
            });

            const currentRound: BeloteRound = {
                ...prev.currentRound,
                roundStatus: data.roundStatus,
                trumpSuite: data.trumpSuite,
                currentTurnIndex: data.chosenByTurnIndex,
            };

            return {
                ...prev,
                currentRound,
                rounds: prev.rounds.map((round) =>
                    round.roundNumber === data.roundNumber
                        ? currentRound
                        : round,
                ),
                team1: updateTeamHands(prev.team1),
                team2: updateTeamHands(prev.team2),
            };
        });
    });

    useWsEvent<CardTurnStartedData>("game:cardTurnStarted", (data) => {
        setNextTrickPending((prev) =>
            prev &&
            prev.roundNumber === data.roundNumber &&
            prev.completedTrickNumber < data.trickNumber
                ? null
                : prev,
        );

        setTurnTimer({
            roundNumber: data.roundNumber,
            trickNumber: data.trickNumber,
            currentTurnIndex: data.currentTurnIndex,
            timeoutSeconds: data.timeoutSeconds,
            startedAt: Date.now(),
        });

        setGame((prev) => {
            if (!prev || prev.currentRound?.roundNumber !== data.roundNumber) {
                return prev;
            }

            const nextCurrentTrick =
                prev.currentRound.currentTrick?.trickNumber === data.trickNumber
                    ? prev.currentRound.currentTrick
                    : {
                          trickNumber: data.trickNumber,
                          playedCards: [],
                          winningPlayerIndex: -1,
                          complete: false,
                      };

            const currentRound: BeloteRound = {
                ...prev.currentRound,
                currentTurnIndex: data.currentTurnIndex,
                currentTrickNumber: data.trickNumber,
                currentTrick: nextCurrentTrick,
                tricks: updateTrickInHistory(
                    prev.currentRound.tricks,
                    nextCurrentTrick,
                ),
            };

            return {
                ...prev,
                currentRound,
                rounds: updateRoundInHistory(prev.rounds, currentRound),
            };
        });
    });

    useWsEvent<CardThrownData>("game:cardThrown", (data) => {
        if (data.nextTrickPending) {
            setNextTrickPending({
                kind: "trick",
                roundNumber: data.roundNumber,
                completedTrickNumber: data.trickNumber,
                winningPlayerIndex: data.winningPlayerIndex,
                timeoutSeconds: 3,
                startedAt: Date.now(),
            });
        } else if (data.trickComplete) {
            setNextTrickPending({
                kind: "round",
                roundNumber: data.roundNumber,
                completedTrickNumber: data.trickNumber,
                winningPlayerIndex: data.winningPlayerIndex,
                timeoutSeconds: 5,
                startedAt: Date.now(),
            });
        } else if (!data.trickComplete) {
            setNextTrickPending(null);
        } else {
            setNextTrickPending(null);
        }

        setTurnTimer((prevTimer) => {
            if (data.trickComplete) {
                return prevTimer &&
                    prevTimer.roundNumber === data.roundNumber &&
                    prevTimer.trickNumber > data.trickNumber
                    ? prevTimer
                    : null;
            }

            return {
                roundNumber: data.roundNumber,
                trickNumber: data.trickNumber,
                currentTurnIndex: data.nextTurnIndex,
                timeoutSeconds: data.timeoutSeconds,
                startedAt: Date.now(),
            };
        });

        setGame((prev) => {
            if (!prev || prev.currentRound?.roundNumber !== data.roundNumber) {
                return prev;
            }

            const existingTrick = prev.currentRound.tricks.find(
                (trick) => trick.trickNumber === data.trickNumber,
            );
            const playedTrick: Trick = existingTrick ?? {
                trickNumber: data.trickNumber,
                playedCards: [],
                winningPlayerIndex: -1,
                complete: false,
            };

            const updatedPlayedTrick: Trick = {
                ...playedTrick,
                playedCards: upsertPlayedCard(playedTrick, {
                    playerIndex: data.playerIndex,
                    card: data.card,
                }),
                winningPlayerIndex:
                    data.winningPlayerIndex ?? playedTrick.winningPlayerIndex,
                complete: data.trickComplete,
            };
            const hasNewerCurrentTrick =
                prev.currentRound.currentTrickNumber > data.trickNumber;
            const currentTrick = hasNewerCurrentTrick
                ? prev.currentRound.currentTrick
                : updatedPlayedTrick;
            const currentTrickNumber = hasNewerCurrentTrick
                ? prev.currentRound.currentTrickNumber
                : data.trickNumber;

            const currentRound: BeloteRound = {
                ...prev.currentRound,
                roundStatus:
                    data.trickComplete && !data.nextTrickPending
                        ? RoundStatus.FINISHED
                        : prev.currentRound.roundStatus,
                currentTurnIndex: hasNewerCurrentTrick
                    ? prev.currentRound.currentTurnIndex
                    : data.nextTurnIndex,
                currentTrickNumber,
                team1RoundPoints: data.team1RoundPoints,
                team2RoundPoints: data.team2RoundPoints,
                currentTrick,
                tricks: updateTrickInHistory(
                    prev.currentRound.tricks,
                    updatedPlayedTrick,
                ),
            };

            return {
                ...prev,
                currentRound,
                rounds: updateRoundInHistory(prev.rounds, currentRound),
                team1: updateTeamHandsForThrownCard(
                    {
                        ...prev.team1,
                        totalScore: data.team1TotalScore,
                    },
                    data.playerIndex,
                    data.card,
                ),
                team2: updateTeamHandsForThrownCard(
                    {
                        ...prev.team2,
                        totalScore: data.team2TotalScore,
                    },
                    data.playerIndex,
                    data.card,
                ),
            };
        });
    });

    useWsEvent<{ gameStatus: GameStatus }>("game:statusChanged", (data) => {
        console.log("Game status changed:", data);
        setGame((prev) =>
            prev
                ? {
                      ...prev,
                      status: data.gameStatus,
                  }
                : prev,
        );

        if (data.gameStatus === GameStatus.IN_PROGRESS && phase === "loading") {
            setPhase("countdown");
        }
    });

    // Tell the backend we've loaded when the lobby transitions to InGame
    useEffect(() => {
        if (lobby?.status === LobbyStatus.InGame) {
            ws.send("game:loaded", {});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lobby?.status]);

    const chooseTrump = (suite: Suite) => {
        ws.send("game:trump:choose", { suite });
    };

    const passTrump = () => {
        ws.send("game:trump:pass", null);
    };

    const throwCard = (card: Card) => {
        ws.send("game:card:throw", {
            suite: card.suite,
            rank: card.rank,
        });
    };

    return (
        <GameContext.Provider
            value={{
                game,
                phase,
                trumpChoice,
                turnTimer,
                nextTrickPending,
                setPhase,
                chooseTrump,
                passTrump,
                throwCard,
            }}
        >
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const context = useContext(GameContext);

    if (!context) {
        throw new Error("useGame must be used within a GameProvider");
    }

    return context;
}
