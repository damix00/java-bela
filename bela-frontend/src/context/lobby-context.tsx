"use client";

import {
    createContext,
    Dispatch,
    SetStateAction,
    useContext,
    useState,
} from "react";
import { useWsEvent } from "@/hooks/ws/use-event";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import {
    Lobby,
    LobbyPlayer,
    LobbyPlayerStatus,
    LobbyStatus,
} from "@/types/lobby";

type LobbyContextType = {
    lobby: Lobby | null;
    setLobby: Dispatch<SetStateAction<Lobby | null>>;
};

const LobbyContext = createContext<LobbyContextType>({
    lobby: null,
    setLobby: () => {},
});

export function LobbyProvider({ children }: { children: React.ReactNode }) {
    const auth = useAuth();
    const [lobby, setLobby] = useState<Lobby | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    useWsEvent<any>("lobby:initialState", (data) => {
        console.log("Received lobby initial state:", data);
        setLobby(data.lobby);

        if (!pathname.startsWith("/play")) {
            router.push("/play");
        }
    });

    useWsEvent("lobby:playerJoined", (data: any) => {
        console.log("Player joined:", data.player);
        setLobby((prev) => {
            if (!prev) return prev;

            const seat = data.player.seat;
            if (seat < 0 || seat >= 4) {
                console.warn(
                    `Invalid seat ${seat} for player ${data.player.userId}`,
                );
                return prev;
            }

            return {
                ...prev,
                playerSeats: {
                    ...prev.playerSeats,
                    [seat]: {
                        userId: data.player.userId,
                        host: data.player.host,
                        seat,
                        bot: data.player.bot,
                        status: LobbyPlayerStatus.NotReady,
                    },
                },
            };
        });
    });

    useWsEvent("lobby:playerLeft", (data: any) => {
        console.log("Player left:", data.userId);

        if (data.userId === auth.user?.id) {
            window.location.href = "/";
            return;
        }

        setLobby((prev) => {
            if (!prev) return prev;

            for (const seat in prev.playerSeats) {
                if (prev.playerSeats[seat]?.userId === data.userId) {
                    return {
                        ...prev,
                        playerSeats: { ...prev.playerSeats, [seat]: null },
                    };
                }
            }
            return prev;
        });
    });

    useWsEvent("lobby:playerStatusChange", (data: any) => {
        console.log("Player status changed:", data.userId, data.status);

        setLobby((prev) => {
            if (!prev) return prev;

            for (const seat in prev.playerSeats) {
                const player = prev.playerSeats[seat];
                if (player?.userId === data.userId) {
                    return {
                        ...prev,
                        playerSeats: {
                            ...prev.playerSeats,
                            [seat]: {
                                ...player,
                                status: data.status as LobbyPlayerStatus,
                            },
                        },
                    };
                }
            }
            return prev;
        });
    });

    useWsEvent("lobby:hostUpdated", (data: any) => {
        const id = data.newHostId;
        console.log("Lobby host updated:", id);

        setLobby((prev) => {
            if (!prev) return prev;

            const updatedSeats = { ...prev.playerSeats };
            for (const seat in updatedSeats) {
                const player = updatedSeats[seat];
                if (player) {
                    updatedSeats[seat] = {
                        ...player,
                        host: player.userId === id,
                    };
                }
            }

            return { ...prev, playerSeats: updatedSeats };
        });
    });

    useWsEvent("lobby:gameCreated", (data: any) => {
        console.log("Game created:", data);
        setLobby((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                gameId: data.game?.id ?? null,
                status: LobbyStatus.InGame,
            };
        });
    });

    useWsEvent(
        "lobby:seatsUpdated",
        (data: { userSeats: Map<string, LobbyPlayer> }) => {
            console.log("Lobby seats updated:", data);

            setLobby((prev) => {
                if (!prev) return prev;

                const updatedSeats: { [key: number]: LobbyPlayer } = {};

                for (const [seat, player] of Object.entries(data.userSeats)) {
                    const seatNum = parseInt(seat, 10);
                    if (seatNum >= 0 && seatNum < 4) {
                        updatedSeats[seatNum] = player;
                    } else {
                        console.warn(
                            `Invalid seat number ${seat} in seats update`,
                        );
                    }
                }

                return { ...prev, playerSeats: updatedSeats };
            });
        },
    );

    return (
        <LobbyContext.Provider value={{ lobby, setLobby }}>
            {children}
        </LobbyContext.Provider>
    );
}

export function useLobby() {
    const context = useContext(LobbyContext);

    if (!context) {
        throw new Error("useLobby must be used within a LobbyProvider");
    }

    return context;
}
