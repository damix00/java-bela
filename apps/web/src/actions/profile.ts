"use server";

import { cookies } from "next/headers";

import { internalApiFetch } from "@/api/internal";
import type { User } from "@/api/types/user";
import {
    ACCESS_TOKEN_COOKIE,
    clearSessionCookies,
    setUserCookie,
} from "@/actions/cookies";
// A `"use server"` module may export nothing but async functions — every export
// of one becomes a callable endpoint — so the result shapes and the error code
// live next door.
import {
    SESSION_EXPIRED,
    type ActionResult,
    type ProfileActionResult,
    type ProfileValues,
} from "@/lib/profile/result";

/**
 * Server-to-server, but on the caller's behalf.
 *
 * `internalApiFetch` carries the internal source token, which says *which app*
 * is calling; endpoints behind `@AuthenticationPrincipal` need to know *who*,
 * and that is the access token. Both headers go, and the access token is read
 * from the httpOnly cookie rather than passed in — a client that could name its
 * own bearer token is a client that could act as someone else.
 */
async function callAsUser<T>(endpoint: string, options: RequestInit = {}) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

    if (!accessToken) {
        // The access cookie expires well before the refresh one, so this is the
        // ordinary case for a tab left open, not a signed-out user.
        return { ok: false as const, status: 401, data: null, error: null };
    }

    return internalApiFetch<T>(endpoint, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
        },
    });
}

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
    values: ProfileValues,
): Promise<ProfileActionResult> {
    const result = await callAsUser<User>("/users/me", {
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
    const result = await callAsUser("/auth/logout-all", { method: "POST" });

    if (!result.ok) {
        return failure(result);
    }

    const cookieStore = await cookies();
    clearSessionCookies(cookieStore);

    return { ok: true };
}
