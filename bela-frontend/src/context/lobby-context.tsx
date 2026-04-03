import {
    createContext,
    Dispatch,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from "react";
import { useWebSocket } from "./ws-context";
import { useWsEvent } from "@/hooks/ws/use-event";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import { BeloteGame } from "@/types/game";

export enum LobbyPlayerStatus {
    NotReady = "NOT_READY",
    Ready = "READY",
}

export enum LobbyStatus {
    InLobby = "IN_LOBBY",
    InGame = "IN_GAME",
}

export type LobbyPlayer = {
    userId: string;
    host: boolean;
    seat: number;
    status: LobbyPlayerStatus;
} | null;

export type Lobby = {
    id: string;
    gameId: string | null;
    inviteCode: string;
    status: LobbyStatus;
    playerSeats: { [key: number]: LobbyPlayer };
};

type LobbyContextType = {
    lobby: Lobby | null;
    setLobby: Dispatch<SetStateAction<Lobby | null>>;
    // Holds the game snapshot received from lobby:initialState before GameProvider mounts
    pendingGame: BeloteGame | null;
    clearPendingGame: () => void;
};

const LobbyContext = createContext<LobbyContextType>({
    lobby: null,
    setLobby: () => {},
    pendingGame: null,
    clearPendingGame: () => {},
});

export function LobbyProvider({ children }: { children: React.ReactNode }) {
    const ws = useWebSocket();
    const auth = useAuth();
    const [lobby, setLobby] = useState<Lobby | null>(null);
    const [pendingGame, setPendingGame] = useState<BeloteGame | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    useWsEvent<any>("lobby:initialState", (data) => {
        console.log("Received lobby initial state:", data);
        setLobby(data.lobby);

        // If the lobby has an active game, go to the game view
        if (data.lobby?.status === LobbyStatus.InGame || data.game) {
            // Store the game so GameProvider can pick it up after mounting
            if (data.game) {
                setPendingGame(data.game);
            }
            if (!pathname.startsWith("/game")) {
                router.push("/game");
            }
        } else if (!pathname.startsWith("/play")) {
            router.push("/play");
        }
    });

    useWsEvent("lobby:playerJoined", (data: any) => {
        console.log("Player joined:", data.player);
        setLobby((prevLobby: Lobby | null) => {
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

        if (data.userId === auth.user?.id) {
            // The current user left. Redirect to home page immediately.
            window.location.href = "/";
            return; // Exit early since we don't need to update the lobby state
        }

        setLobby((prevLobby: Lobby | null) => {
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

    useWsEvent("lobby:playerStatusChange", (data: any) => {
        console.log("Player status changed:", data.userId, data.status);

        setLobby((prevLobby: Lobby | null) => {
            if (!prevLobby) return prevLobby;

            for (const seat in prevLobby.playerSeats) {
                const player = prevLobby.playerSeats[seat];
                if (player?.userId === data.userId) {
                    // Update the player's status
                    return {
                        ...prevLobby,
                        playerSeats: {
                            ...prevLobby.playerSeats,
                            [seat]: {
                                ...player,
                                status: data.status as LobbyPlayerStatus,
                            },
                        },
                    } as Lobby;
                }
            }

            return prevLobby; // If player not found, return unchanged lobby
        });
    });

    useWsEvent("lobby:hostUpdated", (data: any) => {
        const id = data.newHostId;

        console.log("Lobby host updated:", id);

        setLobby((prevLobby: Lobby | null) => {
            if (!prevLobby) return prevLobby;

            const updatedPlayerSeats = { ...prevLobby.playerSeats };

            for (const seat in updatedPlayerSeats) {
                const player = updatedPlayerSeats[seat];
                if (player) {
                    updatedPlayerSeats[seat] = {
                        ...player,
                        host: player.userId === id,
                    };
                }
            }

            return {
                ...prevLobby,
                playerSeats: updatedPlayerSeats,
            } as Lobby;
        });
    });

    useWsEvent("lobby:gameCreated", (data: any) => {
        console.log("Game created:", data);
        setLobby((prevLobby: Lobby | null) => {
            if (!prevLobby) return prevLobby;
            return {
                ...prevLobby,
                gameId: data.game?.id ?? null,
                status: LobbyStatus.InGame,
            };
        });
        router.push("/game");
    });

    useWsEvent("lobby:seatsUpdated", (data: any) => {
        // returns seat map:
        // Map<int, string> where key is seat number and value is userId of player sitting in that seat
        console.log("Lobby seats updated:", data);

        setLobby((prevLobby: Lobby | null) => {
            if (!prevLobby) return prevLobby;

            const updatedPlayerSeats: { [key: number]: LobbyPlayer } = {};

            for (const seat in data.userSeats) {
                const userId = data.userSeats[seat];
                const seatNumber = parseInt(seat);
                if (userId) {
                    // If there's a userId for this seat, find the corresponding player info
                    const existingPlayer = Object.values(
                        prevLobby.playerSeats,
                    ).find((p) => p?.userId === userId);

                    updatedPlayerSeats[seatNumber] = existingPlayer
                        ? { ...existingPlayer, seat: seatNumber }
                        : {
                              userId,
                              host: false,
                              seat: seatNumber,
                              status: LobbyPlayerStatus.NotReady,
                          };
                } else {
                    // If no userId, set the seat to null
                    updatedPlayerSeats[seatNumber] = null;
                }
            }

            return {
                ...prevLobby,
                playerSeats: updatedPlayerSeats,
            } as Lobby;
        });
    });

    return (
        <LobbyContext.Provider value={{ lobby, setLobby, pendingGame, clearPendingGame: () => setPendingGame(null) }}>
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
