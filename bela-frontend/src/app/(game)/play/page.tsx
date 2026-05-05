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
            <div className="flex h-dvh w-screen items-center justify-center overflow-hidden">
                <Loader />
            </div>
        );
    }

    if (lobby.status === LobbyStatus.InGame) {
        return (
            <div className="fixed inset-0 overflow-hidden">
                <GameView />
            </div>
        );
    }

    return <LobbyScreen />;
}
