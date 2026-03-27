"use client";

import { logout } from "@/actions/auth";
import Button from "@/components/input/button";
import { useAuth } from "@/context/auth-context";
import { useWebSocket } from "@/hooks/ws";
import CompeteOnlineCard from "./compete-online-card";
import { useState } from "react";

export default function GameScreen() {
    const { user } = useAuth();
    const { status } = useWebSocket();
    const [matchmaking, setMatchmaking] = useState(false);
    const ws = useWebSocket();

    const handleQuickMatch = () => {
        ws.send("lobby:create", null);
    };

    return (
        <div className="min-h-screen p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-heading font-bold">
                        Welcome, {user?.username}!
                    </h1>
                    <p className="text-foreground-muted text-sm">
                        Ready to play some Bela?
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        variant="text"
                        size="sm"
                        onClick={() =>
                            logout().then(() => (window.location.href = "/"))
                        }>
                        Log Out
                    </Button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4 max-w-2xl">
                <CompeteOnlineCard
                    onQuickMatch={handleQuickMatch}
                    loading={matchmaking}
                />
            </div>
        </div>
    );
}
