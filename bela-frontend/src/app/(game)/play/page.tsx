"use client";

import Loader from "@/components/ui/loader";
import { useLobby } from "@/context/lobby-context";
import { LobbyStatus } from "@/types/lobby";
import LobbyScreen from "@/components/pages/lobby/lobby-screen";
import GameView from "@/components/pages/game/game-view";

export default function PlayPage() {
    const { lobby } = useLobby();

    if (!lobby) {
        return (
            <div className="flex min-h-screen w-screen items-center justify-center">
                <Loader />
            </div>
        );
    }

    if (lobby.status === LobbyStatus.InGame) {
        return <GameView />;
    }

    return <LobbyScreen />;
}
