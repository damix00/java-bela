"use client";

import { LobbyPlayer, LobbyPlayerStatus } from "@/types/lobby";
import { useWebSocket } from "@/context/ws-context";
import { getUserData, PublicUserData } from "@/lib/user-cache";
import { BotIcon, UserIcon } from "lucide-react";
import { useEffect, useState } from "react";

const BOT_NAMES = ["Alpha", "Beta", "Gamma", "Delta"];

export function PlayerCard({
    player,
    slot,
}: {
    player?: LobbyPlayer;
    slot: number;
}) {
    const [playerData, setPlayerData] = useState<PublicUserData | null>(null);
    const ws = useWebSocket();

    useEffect(() => {
        if (!player) {
            setPlayerData(null);
            return;
        }

        console.log(player);

        if (player.bot) {
            setPlayerData({
                id: player.userId,
                username: `Bot ${BOT_NAMES[slot] ?? slot + 1}`,
                avatarUrl: null,
                createdAt: new Date().toISOString(),
            });
            return;
        }

        getUserData(player.userId).then(setPlayerData);
    }, [player, slot]);

    const handleSlotClick = () => {
        ws.send("lobby:swapSeats", { seat: slot });
    };

    if (!player) {
        return (
            <div
                onClick={handleSlotClick}
                className="select-none flex cursor-pointer items-center gap-4 rounded-lg border-2 border-dashed border-white/10 bg-background-tertiary p-4 opacity-50 hover:bg-white/5 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-black">
                    <UserIcon size={24} />
                </div>
                <div>
                    <p className="font-medium text-foreground-muted">
                        Waiting for player...
                    </p>
                </div>
            </div>
        );
    }

    if (!playerData) {
        return (
            <div
                onClick={handleSlotClick}
                className="flex select-none cursor-pointer items-center gap-4 rounded-lg border-2 border-dashed border-white/10 bg-background-tertiary p-4 hover:bg-white/5 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-black">
                    <UserIcon size={24} />
                </div>
                <div>
                    <p className="font-medium text-white">Loading player...</p>
                </div>
            </div>
        );
    }

    const isBot = !!player.bot;
    const Icon = isBot ? BotIcon : UserIcon;

    return (
        <div
            onClick={handleSlotClick}
            className="select-none flex items-center gap-4 rounded-lg bg-background-tertiary border border-white/10 p-4 shadow-sm">
            <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${isBot ? "bg-blue-500" : "bg-primary"} text-black`}>
                <Icon size={24} />
            </div>
            <div className="flex-1">
                <p className="font-semibold text-white">
                    {playerData.username}
                </p>
                <div className="flex items-center gap-2 text-sm">
                    {isBot && (
                        <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                            Bot
                        </span>
                    )}
                    {player.host && (
                        <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                            Host
                        </span>
                    )}
                    <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                            player.status === LobbyPlayerStatus.Ready
                                ? "bg-green-500/20 text-green-500"
                                : "bg-gray-500/20 text-gray-400"
                        }`}>
                        {player.status === LobbyPlayerStatus.Ready
                            ? "Ready"
                            : "Not Ready"}
                    </span>
                </div>
            </div>
        </div>
    );
}
