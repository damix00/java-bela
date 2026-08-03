import { LobbyPlayer } from "@/types/lobby";
import { PlayerCard } from "./player-card";

interface LobbyTeamProps {
    teamName: string;
    players: (LobbyPlayer | undefined)[];
    className?: string;
    teamNumber: number;
}

export function LobbyTeam({
    teamName,
    players,
    teamNumber,
    className = "",
}: LobbyTeamProps) {
    return (
        <div
            className={`flex w-full flex-col gap-6 p-6 md:w-1/2 md:p-12 ${className}`}>
            <h2 className="text-xl font-bold tracking-tight text-white/90 uppercase text-center sm:text-left">
                {teamName}
            </h2>
            <div className="flex flex-col gap-4">
                <PlayerCard slot={teamNumber * 2} player={players[0]} />
                <PlayerCard slot={teamNumber * 2 + 1} player={players[1]} />
            </div>
        </div>
    );
}
