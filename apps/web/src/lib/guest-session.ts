import type { User } from "@/api/types/user";

/**
 * How long an anonymous account lives.
 *
 * Kept in step with `UserCleanupService.cleanupAnonymousUsers` on the API,
 * which deletes `ANONYMOUS` users whose `createdAt` is more than 24 hours old.
 * The sweep runs hourly, so the real deletion lands somewhere in the hour after
 * this — the countdown is the earliest moment the account can go, never a
 * promise that it survives right up to zero.
 */
export const GUEST_LIFETIME_MS = 24 * 60 * 60 * 1000;

/** Epoch milliseconds at which this guest account becomes eligible for the sweep. */
export function guestExpiresAt(user: User): number {
    return new Date(user.createdAt).getTime() + GUEST_LIFETIME_MS;
}

/**
 * The deadline and the "time left" label for it, read against the clock now.
 *
 * The clock read lives here rather than in the banner's render because it is
 * impure by definition, and the React Compiler is right to refuse it in a
 * component body. A server component rendering a dynamic page may absolutely
 * ask what time it is — it just has to say so out loud, which is what calling
 * this is. `label` is null once the deadline has passed.
 */
export function guestCountdown(user: User, units: CountdownUnits) {
    const expiresAt = guestExpiresAt(user);

    return { expiresAt, label: formatTimeLeft(expiresAt - Date.now(), units) };
}

export type CountdownUnits = {
    /** Suffix for the hours figure — "h". */
    hours: string;
    /** Suffix for the minutes figure — "m" / "min". */
    minutes: string;
};

/**
 * A coarse "time left" string: hours and minutes, or minutes alone in the last
 * hour. Seconds are deliberately absent — a banner that ticks every second is a
 * countdown clock, and this is a nudge.
 *
 * Returns null once the deadline has passed, which callers read as "the sweep
 * could take this account at any moment".
 */
export function formatTimeLeft(
    remainingMs: number,
    units: CountdownUnits,
): string | null {
    if (remainingMs <= 0) return null;

    const totalMinutes = Math.floor(remainingMs / 60_000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours < 1) return `${minutes}${units.minutes}`;

    return `${hours}${units.hours} ${minutes}${units.minutes}`;
}
