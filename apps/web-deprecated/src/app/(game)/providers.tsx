"use client";

import { LobbyProvider } from "@/context/lobby-context";
import { GameProvider } from "@/context/game-context";
import { WebSocketProvider } from "@/hooks/ws";
import {
  ConnectionOverlay,
  WsErrorToaster,
} from "@/components/pages/game/connection-status";
import { ReactNode } from "react";

export function GameProviders({ children }: { children: ReactNode }) {
  return (
    <WebSocketProvider>
      <LobbyProvider>
        <GameProvider>{children}</GameProvider>
        <WsErrorToaster />
        <ConnectionOverlay />
      </LobbyProvider>
    </WebSocketProvider>
  );
}
