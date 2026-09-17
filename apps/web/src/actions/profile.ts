"use server";

import { cookies } from "next/headers";

import { authenticatedApiFetch } from "@/api/authenticated";
import type { User } from "@/api/types/user";
import {
    clearSessionCookies,
    setUserCookie,
    setWelcomeDone,
} from "@/actions/cookies";
// A `"use server"` module may export nothing but async functions — every export
// of one becomes a callable endpoint — so the result shapes and the error code
// live next door.
import {
    SESSION_EXPIRED,
    type ActionResult,
    type ProfileActionResult,
    type ProfileUpdate,
} from "@/lib/profile/result";

/** Maps a failed call onto the shape the screens render. */
function failure(result: {
    status: number;
    error: { message?: string; code?: string } | null;
}) {
    return {
        ok: false as const,
        // The backend's own message is the specific one ("Username already
        // exists"); the screen falls back to localised copy when there isn't one.
        error: result.error?.message ?? "",
        code:
            result.status === 401
                ? SESSION_EXPIRED
                : result.status === 0
                  ? "NETWORK"
                  : result.error?.code,
    };
}

/**
 * Saves the profile form.
 *
 * The updated user comes back rather than a bare 204 so the session cookie can
 * be rewritten here, in the same round trip — every server render reads the
 * player's name out of that cookie, so a save that skipped it would leave the
 * top bar showing the old one until the next token rotation.
 *
 * A 401 is reported rather than retried: only the client can refresh, since
 * `refreshAccessToken` is the thing that owns single-flight and the token store.
 */
export async function updateProfile(
    values: ProfileUpdate,
): Promise<ProfileActionResult> {
    const result = await authenticatedApiFetch<User>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(values),
    });

    if (!result.ok || !result.data) {
        return failure(result);
    }

    const cookieStore = await cookies();
    setUserCookie(cookieStore, result.data);

    return { ok: true, user: result.data };
}

/**
 * Revokes every refresh token this account holds — this browser's included, so
 * the caller is signed out too. The local cookies go with it, because the
 * session they name is already dead server-side.
 */
export async function signOutEverywhere(): Promise<ActionResult> {
    const result = await authenticatedApiFetch("/auth/logout-all", {
        method: "POST",
    });

    if (!result.ok) {
        return failure(result);
    }

    const cookieStore = await cookies();
    clearSessionCookies(cookieStore);

    return { ok: true };
}

/**
 * Marks the post-sign-up profile step as answered.
 *
 * Saved and skipped both land here: the promise made by the skip link is that
 * the screen does not come back, and a player who filled it in has even less
 * reason to see it again. Writing the flag is the whole of the call — it is a
 * server action rather than a `document.cookie` line only because the cookie is
 * httpOnly, which is what lets the page read it before rendering.
 */
export async function dismissWelcome(): Promise<void> {
    const cookieStore = await cookies();
    setWelcomeDone(cookieStore);
}
