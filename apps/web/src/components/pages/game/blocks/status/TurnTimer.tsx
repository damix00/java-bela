"use client";

import { useEffect, useState } from "react";

import type { Countdown } from "@/context/game-context";
import { cn } from "@/lib/cn";

/**
 * Seconds left on a server-scheduled task.
 *
 * Every duration on this screen comes off the wire — the events carry
 * `timeoutSeconds`, and a reconnect snapshot carries what is left of whichever
 * task was already running. Nothing here assumes a length, which is why a reload
 * mid-trick resumes the clock where it stood rather than restarting it.
 *
 * Stored as an origin (`startedAt` plus a duration) rather than a decrementing
 * number, so a re-render for any other reason cannot nudge the count.
 */
export function useRemainingSeconds(countdown: Countdown | null) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!countdown) return;

        // Four times a second: a whole-second tick visibly stutters against a
        // clock it is not aligned to, and this is cheap.
        const id = setInterval(() => setNow(Date.now()), 250);
        return () => clearInterval(id);
    }, [countdown]);

    if (!countdown) return null;

    const elapsed = (now - countdown.startedAt) / 1000;

    return Math.max(0, Math.ceil(countdown.timeoutSeconds - elapsed));
}

export default function TurnTimer({
    countdown,
    label,
    urgent = false,
}: {
    countdown: Countdown | null;
    label: string;
    urgent?: boolean;
}) {
    const remaining = useRemainingSeconds(countdown);

    if (remaining === null) return null;

    return (
        <p
            aria-live="off"
            className={cn(
                "text-center text-[13px] font-semibold text-mint/75",
                // Only once it is nearly out, and only when it is your clock.
                urgent && remaining <= 5 && "text-rust",
            )}
        >
            {label.replace("{seconds}", String(remaining))}
        </p>
    );
}
