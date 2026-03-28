"use client";

import Loader from "@/components/ui/loader";
import { useLobby } from "@/context/lobby-context";
import LobbyScreen from "@/components/pages/lobby/lobby-screen";

export default function LobbyPage() {
    const { lobby } = useLobby();

    if (!lobby) {
        console.warn("Lobby data is not available. Rendering null.");
        return (
            <div className="flex min-h-screen w-screen items-center justify-center">
                <Loader />
            </div>
        );
    }

    return <LobbyScreen />;
}
