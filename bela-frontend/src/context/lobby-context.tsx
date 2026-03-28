import { createContext, useContext, useEffect, useState } from "react";
import { useWebSocket } from "./ws-context";
import { useWsEvent } from "@/hooks/ws/use-event";
import { usePathname, useRouter } from "next/navigation";

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
    setLobby: (lobby: Lobby | null) => void;
};

const LobbyContext = createContext<LobbyContextType>({
    lobby: null,
    setLobby: () => {},
});

export function LobbyProvider({ children }: { children: React.ReactNode }) {
    const ws = useWebSocket();
    const [lobby, setLobby] = useState<Lobby | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    useWsEvent<any>("lobby:initialState", (data) => {
        console.log("Received lobby initial state:", data);
        setLobby(data.lobby);
        if (!pathname.startsWith(`/play`)) {
            router.push(`/play`);
        }
    });

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
