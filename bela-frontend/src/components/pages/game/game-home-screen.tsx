"use client";

import { logout } from "@/actions/auth";
import Button from "@/components/input/button";
import { useAuth } from "@/context/auth-context";
import { useWebSocket } from "@/hooks/ws";
import CompeteOnlineCard from "./compete-online-card";
import { useRef, useState } from "react";
import TextInput from "@/components/input/text-input";

export default function GameHomeScreen() {
    const { user } = useAuth();
    const { status } = useWebSocket();
    const [matchmaking, setMatchmaking] = useState(false);
    const ws = useWebSocket();

    const codeRef = useRef("");

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
            <div className="space-y-4 max-w-2xl flex flex-col md:flex-row flex-wrap">
                <CompeteOnlineCard
                    onQuickMatch={handleQuickMatch}
                    loading={matchmaking}
                />

                {/* Join lobby via code */}
                <div className="flex flex-col gap-4 w-full">
                    <p className="text-foreground-muted text-sm">
                        Or join an existing lobby:
                    </p>
                    <TextInput
                        placeholder="Enter lobby code"
                        onChange={(e) => (codeRef.current = e.target.value)}
                    />
                    <Button
                        variant="ghostPrimary"
                        onClick={() => {
                            ws.send("lobby:join:code", {
                                inviteCode: codeRef.current,
                            });
                        }}>
                        Join Lobby
                    </Button>
                </div>
            </div>
        </div>
    );
}
