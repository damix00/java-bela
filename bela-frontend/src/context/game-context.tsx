"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { useWsEvent } from "@/hooks/ws/use-event";
import { useWebSocket } from "./ws-context";
import { useLobby } from "./lobby-context";
import { BeloteGame, GameStatus } from "@/types/game";

export type GamePhase =
  | "loading" // Waiting for all players to load
  | "countdown" // 3-second countdown after all loaded
  | "round_starting" // Brief "Round X" text
  | "playing" // Active gameplay
  | "finished"; // Game over

type GameContextType = {
  game: BeloteGame | null;
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
};

const GameContext = createContext<GameContextType>({
  game: null,
  phase: "loading",
  setPhase: () => {},
});

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [game, setGame] = useState<BeloteGame | null>(null);
  const [phase, setPhase] = useState<GamePhase>("loading");
  const ws = useWebSocket();
  const { pendingGame, clearPendingGame } = useLobby();

  // On mount: if lobby context already has a game (from lobby:initialState arriving before
  // this provider mounted), restore it directly — skip countdown since game is already active.
  useEffect(() => {
    if (pendingGame) {
      console.log("Game restored from pending state:", pendingGame);
      setGame(pendingGame);
      setPhase(pendingGame.status === GameStatus.IN_PROGRESS ? "playing" : "loading");
      clearPendingGame();
    } else {
      // Fresh load — tell the backend we've loaded
      ws.send("game:loaded", {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Receive initial game snapshot (sent to individual player on load)
  useWsEvent<{ game: BeloteGame }>("lobby:game:snapshot", (data) => {
    console.log("Game snapshot received:", data);
    setGame(data.game);
  });

  // Game status updated (broadcast when all 4 players loaded → IN_PROGRESS)
  useWsEvent<{ game: BeloteGame }>("game:statusUpdated", (data) => {
    console.log("Game status updated:", data);
    setGame(data.game);

    if (data.game.status === GameStatus.IN_PROGRESS && phase === "loading") {
      setPhase("countdown");
    }
  });

  return (
    <GameContext.Provider value={{ game, phase, setPhase }}>
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
