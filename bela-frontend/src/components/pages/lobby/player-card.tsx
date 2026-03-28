import { apiFetch } from "@/api/client";
import { User } from "@/api/types/user";
import { LobbyPlayer, LobbyPlayerStatus } from "@/context/lobby-context";
import { PublicUserData } from "@/lib/user-cache";
import { UserIcon } from "lucide-react";
import { useEffect, useState } from "react";

export function PlayerCard({ player }: { player?: LobbyPlayer }) {
    const [playerData, setPlayerData] = useState<PublicUserData | null>(null);

    useEffect(() => {
        async function fetchPlayerData() {
            if (player) {
                try {
                    const response = await apiFetch<PublicUserData>(
                        `/users/${player.userId}`,
                    );
                    if (!response.error) {
                        setPlayerData(response.data);
                    } else {
                        console.error(
                            `Failed to fetch user data for ${player.userId}`,
                        );
                    }
                } catch (error) {
                    console.error(
                        `Error fetching user data for ${player.userId}:`,
                        error,
                    );
                }
            }
        }

        fetchPlayerData();
    }, [player]);

    if (!player) {
        return (
            <div className="flex items-center gap-4 rounded-lg border-2 border-dashed border-white/10 bg-background-tertiary p-4 opacity-50">
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
            <div className="flex items-center gap-4 rounded-lg border-2 border-dashed border-white/10 bg-background-tertiary p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-black">
                    <UserIcon size={24} />
                </div>
                <div>
                    <p className="font-medium text-white">Loading player...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4 rounded-lg bg-background-tertiary border border-white/10 p-4 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-black">
                <UserIcon size={24} />
            </div>
            <div className="flex-1">
                <p className="font-semibold text-white">
                    {playerData.username}
                </p>
                <div className="flex items-center gap-2 text-sm">
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
