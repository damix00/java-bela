"use client";

import { LobbyProvider } from "@/context/lobby-context";
import { WebSocketProvider } from "@/hooks/ws";
import { ReactNode } from "react";

export function GameProviders({ children }: { children: ReactNode }) {
    return (
        <WebSocketProvider>
            <LobbyProvider>{children}</LobbyProvider>
        </WebSocketProvider>
    );
}
