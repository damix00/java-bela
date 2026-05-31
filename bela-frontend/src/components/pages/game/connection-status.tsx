"use client";

import { toast } from "sonner";
import { useWebSocket } from "@/context/ws-context";
import { useWsEvent } from "@/hooks/ws/use-event";

type WsErrorMessage = {
    event?: string;
    message?: string;
    status?: number;
};

/**
 * Surfaces backend "error:<event>" messages as a toast so failures
 * (illegal move, not your turn, …) are no longer silent.
 */
export function WsErrorToaster() {
    useWsEvent<WsErrorMessage>("error", (message) => {
        toast.error(message?.message ?? "Something went wrong");
    });

    return null;
}

/**
 * Full-screen "reconnecting" overlay shown whenever the socket is not
 * currently connected, so a dropped connection mid-game is visible. The
 * backend re-sends a fresh game snapshot automatically on reconnect
 * (UserReconnectedEvent -> GameReconnectService), so no manual resync needed.
 */
export function ConnectionOverlay() {
    const { status } = useWebSocket();

    if (status === "connected") {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-xl bg-neutral-900/90 px-8 py-6 text-center text-white shadow-xl">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <p className="text-sm font-medium">
                    {status === "connecting"
                        ? "Connecting…"
                        : "Reconnecting…"}
                </p>
                <p className="text-xs text-white/60">
                    Your game is saved — hang tight.
                </p>
            </div>
        </div>
    );
}
