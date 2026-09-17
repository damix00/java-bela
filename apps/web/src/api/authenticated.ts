import "server-only";

import { cookies } from "next/headers";

import { internalApiFetch } from "@/api/internal";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session-cookies";

/**
 * Calls the backend on behalf of the signed-in player.
 *
 * The internal source token identifies the web application; the bearer token
 * identifies the player. The latter stays in its httpOnly cookie and is never
 * accepted from a browser argument, so callers cannot choose which account a
 * server-side request acts as.
 */
export async function authenticatedApiFetch<T>(
    endpoint: string,
    options: RequestInit = {},
) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

    if (!accessToken) {
        // The shorter-lived access cookie can be absent while the refresh
        // cookie still exists. Callers decide whether that means a retryable
        // action failure or an unavailable page read.
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
