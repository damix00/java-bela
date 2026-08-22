"use client";

import { useEffect, useState } from "react";

import {
    formatTimeLeft,
    type CountdownUnits,
} from "@/lib/guest-session";

type GuestCountdownProps = {
    /** Epoch milliseconds — see `guestExpiresAt`. */
    expiresAt: number;
    /**
     * The same string the server already rendered. Held as the initial state so
     * the first client render matches the HTML exactly: computing the time on
     * mount instead would hydrate a different number than the one that was
     * sent, which React reports as a mismatch and the player sees flicker.
     */
    initial: string;
    units: CountdownUnits;
    /** Shown once the deadline is behind us. */
    expiredLabel: string;
};

/** How often the figure is redrawn. Minutes are the smallest unit it shows. */
const TICK_MS = 30_000;

/**
 * The live half of the guest banner: the hours left before the API's sweep is
 * entitled to delete this account.
 *
 * It ticks rather than sitting at whatever the page was rendered with, because
 * the lobby is a screen people leave open — a number frozen at "23h" while the
 * afternoon goes by is the one thing that would make this claim look invented.
 */
export default function GuestCountdown({
    expiresAt,
    initial,
    units,
    expiredLabel,
}: GuestCountdownProps) {
    const [label, setLabel] = useState(initial);
    // Depended on as two strings rather than as `units`: the dictionary crosses
    // the server boundary as a fresh object every render, so an object dep would
    // tear down and rebuild the interval on each one.
    const { hours, minutes } = units;

    useEffect(() => {
        function tick() {
            setLabel(
                formatTimeLeft(expiresAt - Date.now(), { hours, minutes }) ??
                    expiredLabel,
            );
        }

        // Once immediately: a tab restored from the background can be hours past
        // the render it is showing, and waiting a full tick to correct that is
        // exactly when the number is most wrong.
        tick();
        const timer = setInterval(tick, TICK_MS);

        return () => clearInterval(timer);
    }, [expiresAt, hours, minutes, expiredLabel]);

    return (
        <time dateTime={new Date(expiresAt).toISOString()} className="font-bold">
            {label}
        </time>
    );
}
