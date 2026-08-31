"use client";

import { useEffect, useState } from "react";

import type { Countdown } from "@/context/game-context";
import { cn } from "@/lib/ui/cn";

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

    if (remaining === null || !countdown) return null;

    const progress = Math.min(
        100,
        Math.max(0, (remaining / countdown.timeoutSeconds) * 100),
    );
    const critical = urgent && remaining <= 5;

    return (
        <div
            role="timer"
            aria-live="off"
            aria-label={label.replace("{seconds}", String(remaining))}
            className={cn(
                "mx-auto flex w-full max-w-56 items-center gap-2",
                "[@media(max-height:560px)]:max-w-44",
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    "shrink-0 text-[12px] font-semibold text-mint/75 tabular-nums",
                    critical && "text-rust",
                )}
            >
                {label.replace("{seconds}", String(remaining))}
            </span>
            <span
                aria-hidden="true"
                className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-baize-deep/80"
            >
                <span
                    className={cn(
                        "block h-full origin-left rounded-full bg-mint transition-[width,background-color] duration-200",
                        urgent && "bg-rust",
                        critical && "bg-rust",
                    )}
                    style={{ width: `${progress}%` }}
                />
            </span>
        </div>
    );
}
