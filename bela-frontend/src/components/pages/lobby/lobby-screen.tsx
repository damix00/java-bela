"use client";

import { useAuth } from "@/context/auth-context";
import {
    Lobby,
    useLobby,
    LobbyPlayerStatus,
    LobbyPlayer,
} from "@/context/lobby-context";
import { useMemo } from "react";
import { LobbyTeam } from "./lobby-team";
import Button from "@/components/input/button";
import { useWsEvent } from "@/hooks/ws/use-event";
import { useWebSocket } from "@/context/ws-context";

export default function LobbyScreen() {
    const l = useLobby();
    const auth = useAuth();
    const ws = useWebSocket();

    const lobby: Lobby = l.lobby as Lobby;

    useWsEvent("lobby:playerJoined", (data: any) => {
        console.log("Player joined:", data.player);
        l.setLobby((prevLobby: Lobby | null) => {
            if (!prevLobby) return prevLobby; // If lobby is not loaded yet, do nothing

            let seat = data.player.seat;

            // Create a new player object from the data received
            const newPlayer: LobbyPlayer = {
                userId: data.player.userId,
                host: data.player.host,
                seat,
                status: LobbyPlayerStatus.NotReady, // Default to NotReady when a player joins
            };

            // Find the first available seat (null) and assign the new player to it
            const updatedPlayerSeats = prevLobby.playerSeats;

            // Ensure the seat number is within the valid range (0-3)
            if (seat >= 0 && seat < 4) {
                updatedPlayerSeats[seat] = newPlayer;
            } else {
                console.warn(
                    `Received invalid seat number ${seat} for player ${data.player.userId}`,
                );
            }

            // Return the updated lobby state with the new player added
            return {
                ...prevLobby,
                playerSeats: updatedPlayerSeats,
            } as Lobby;
        });
    });
    useWsEvent("lobby:playerLeft", (data: any) => {
        console.log("Player left:", data.userId);

        l.setLobby((prevLobby: Lobby) => {
            if (!prevLobby) return prevLobby;

            for (const seat in prevLobby.playerSeats) {
                const player = prevLobby.playerSeats[seat];
                if (player?.userId === data.userId) {
                    // Set the seat to null when a player leaves
                    return {
                        ...prevLobby,
                        playerSeats: {
                            ...prevLobby.playerSeats,
                            [seat]: null,
                        },
                    } as Lobby;
                }
            }

            return prevLobby; // If player not found, return unchanged lobby
        });
    });
    useWsEvent("lobby:playerReadyStatusChanged", (data: any) => {
        console.log("Player ready status changed:", data.userId, data.status);
    });
    useWsEvent("lobby:hostUpdated", (data: any) => {
        console.log("Lobby host updated:", data);
    });

    // Updated to iterate over the values of the playerSeats object
    const isReady = useMemo(() => {
        for (const player of Object.values(lobby.playerSeats)) {
            if (
                player?.userId === auth.user?.id &&
                player?.status === LobbyPlayerStatus.Ready // or "READY"
            ) {
                return true;
            }
        }
        return false;
    }, [lobby.playerSeats, auth.user?.id]);

    // Updated to access the playerSeats object using seat number keys
    // Added fallback `null` in case a seat is completely undefined in the object
    const team1Players = [
        lobby.playerSeats[0] ?? null,
        lobby.playerSeats[1] ?? null,
    ];
    const team2Players = [
        lobby.playerSeats[2] ?? null,
        lobby.playerSeats[3] ?? null,
    ];

    return (
        <div className="flex min-h-[calc(100vh-80px)] w-full flex-col items-center p-8 pt-8 md:pt-16">
            <h1 className="mb-8 text-3xl font-bold tracking-tight text-white md:text-4xl">
                Match Lobby
            </h1>

            <p className="mb-12 text-gray-400">
                Lobby code:{" "}
                <span className="font-mono text-white">{lobby.inviteCode}</span>
            </p>

            <div className="mx-auto flex w-full max-w-5xl flex-col rounded-2xl bg-background-secondary shadow-2xl md:flex-row">
                <LobbyTeam
                    teamName="Team One"
                    players={team1Players}
                    className="md:border-r md:border-background-tertiary"
                />

                {/* Horizontal divider for mobile only */}
                <div className="h-px w-full bg-background-tertiary md:hidden" />

                <LobbyTeam teamName="Team Two" players={team2Players} />
            </div>

            <div className="mt-12 flex flex-col items-center gap-4">
                <Button size="lg">{isReady ? "Unready" : "Ready"}</Button>
                <Button
                    variant="textPrimary"
                    onClick={() => {
                        ws.send("lobby:leave", null);
                        window.location.href = "/"; // Redirect to home page after leaving lobby
                    }}>
                    Leave Lobby
                </Button>
                <p className="text-sm text-foreground-muted">
                    Waiting for all players to be ready...
                </p>
            </div>
        </div>
    );
}
