"use client";

import { useAuth } from "@/context/auth-context";
import { ScrollingCardsBg } from "@/components/homepage/scrolling-cards-bg";
import { HomeHero } from "@/components/homepage/home-hero";
import { Lobby } from "@/components/lobby/lobby";

export default function HomePage() {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Lobby />;
    }

    return (
        <main className="relative w-full min-h-screen overflow-hidden">
            <ScrollingCardsBg />
            <HomeHero />
        </main>
    );
}
