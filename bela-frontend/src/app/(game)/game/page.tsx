"use client";

import { GameProvider } from "@/context/game-context";
import GameView from "@/components/pages/game/game-view";

export default function GamePage() {
  return (
    <GameProvider>
      <GameView />
    </GameProvider>
  );
}
