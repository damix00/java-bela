"use client";

import GameScreen from "@/components/pages/game/game-screen";
import LandingPage from "@/components/pages/home/landing-page";
import { useAuth } from "@/context/auth-context";

export default function Home() {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <GameScreen />;
    }

    return <LandingPage />;
}
