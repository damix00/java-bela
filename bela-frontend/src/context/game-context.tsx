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
    RoundStatus,
    Suite,
    Team,
} from "@/types/game";
import { LobbyStatus } from "@/types/lobby";

type GameSnapshotData = {
    gameId: string;
    status: GameStatus;
    maxPoints: number;
    team1: Team;
    team2: Team;
    currentRound: BeloteRound | null;
};

type LobbyGameCreatedData = {
    game: BeloteGame;
};

type RoundStartData = {
    roundNumber: number;
    roundStatus: RoundStatus;
    currentTurnIndex: number;
    hand: Card[];
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
    revealedCards: Card[];
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

type GameContextType = {
    game: BeloteGame | null;
    phase: GamePhase;
    trumpChoice: TrumpChoiceState;
    setPhase: (phase: GamePhase) => void;
    chooseTrump: (suite: Suite) => void;
    passTrump: () => void;
};

const GameContext = createContext<GameContextType>({
    game: null,
    phase: "loading",
    trumpChoice: null,
    setPhase: () => {},
    chooseTrump: () => {},
    passTrump: () => {},
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

export function GameProvider({ children }: { children: ReactNode }) {
    const ws = useWebSocket();
    const { lobby } = useLobby();
    const { user } = useAuth();
    const [game, setGame] = useState<BeloteGame | null>(null);
    const [phase, setPhase] = useState<GamePhase>("loading");
    const [trumpChoice, setTrumpChoice] = useState<TrumpChoiceState>(null);

    useWsEvent<LobbyGameCreatedData>("lobby:gameCreated", (data) => {
        console.log("Game created for game context:", data);
        setGame(data.game);
    });

    useWsEvent<GameSnapshotData>("game:snapshot", (data) => {
        console.log("Game snapshot received:", data);
        setGame({
            id: data.gameId,
            team1: data.team1,
            team2: data.team2,
            maxPoints: data.maxPoints,
            status: data.status,
            currentRoundNumber: data.currentRound?.roundNumber ?? -1,
            rounds: [],
            currentRound: data.currentRound,
        });

        if (data.status === GameStatus.IN_PROGRESS) {
            setPhase("playing");
        }
    });

    useWsEvent<RoundStartData>("game:roundStart", (data) => {
        console.log("Round started:", data);

        setGame((prev) => {
            if (!prev) return prev;

            const currentRound: BeloteRound = {
                roundNumber: data.roundNumber,
                roundStatus: data.roundStatus,
                trumpSuite: null,
                currentTurnIndex: data.currentTurnIndex,
                currentTrickNumber: -1,
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
                        hand: merged,
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

    return (
        <GameContext.Provider
            value={{
                game,
                phase,
                trumpChoice,
                setPhase,
                chooseTrump,
                passTrump,
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
