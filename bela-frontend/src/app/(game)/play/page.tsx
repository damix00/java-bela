"use client";

import { useLobby } from "@/context/lobby-context";

export default function LobbyPage() {
    const lobby = useLobby();

    if (!lobby.lobby) {
        console.warn("Lobby data is not available. Rendering null.");
        return null;
    }

    return (
        <div className="flex h-full w-full items-center justify-center">
            <h1 className="text-2xl font-bold">Lobby Page</h1>
        </div>
    );
}
