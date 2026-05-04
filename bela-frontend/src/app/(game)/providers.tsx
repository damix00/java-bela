"use client";

import { LobbyProvider } from "@/context/lobby-context";
import { GameProvider } from "@/context/game-context";
import { WebSocketProvider } from "@/hooks/ws";
import { ReactNode } from "react";

export function GameProviders({ children }: { children: ReactNode }) {
  return (
    <WebSocketProvider>
      <LobbyProvider>
        <GameProvider>{children}</GameProvider>
      </LobbyProvider>
    </WebSocketProvider>
  );
}
