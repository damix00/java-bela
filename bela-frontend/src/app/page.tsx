"use client";

import GameHomeScreen from "@/components/pages/game/game-home-screen";
import LandingPage from "@/components/pages/home/landing-page";
import { useAuth } from "@/context/auth-context";
import { redirect } from "next/navigation";

export default function Home() {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return redirect("/home");
    }

    return <LandingPage />;
}
