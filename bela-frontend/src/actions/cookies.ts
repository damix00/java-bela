import "server-only";

import { BackendAuthResponse } from "@/api/types/user";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
export const USER_COOKIE = "user";

/**
 * A minimal view of both `cookies()` from next/headers and `response.cookies` from
 * NextResponse, so route handlers and server actions can share one writer.
 */
type CookieWriter = {
    set(name: string, value: string, options?: CookieOptions): unknown;
    delete(name: string): unknown;
};

type CookieOptions = {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
    maxAge?: number;
    path?: string;
};

/**
 * "lax" rather than "strict": strict withholds cookies on top-level cross-site navigation,
 * so following an invite link from a chat app would land the user logged out. Lax still
 * blocks cross-site POSTs, which is what protects the refresh route.
 */
function baseOptions(): CookieOptions {
    return {
        httpOnly: true,
        secure: process.env.SECURE_COOKIES === "true",
        sameSite: "lax",
        path: "/",
    };
}

/**
 * Writes the session cookies from a backend auth response.
 *
 * The refresh token is only written when the backend returned one — on a grace-window
 * rotation it returns null, meaning the token already in the jar is still the live one and
 * must not be clobbered.
 */
export function setSessionCookies(store: CookieWriter, auth: BackendAuthResponse) {
    const options = baseOptions();

    store.set(ACCESS_TOKEN_COOKIE, auth.accessToken, {
        ...options,
        maxAge: auth.expiresIn,
    });

    if (!auth.refreshToken) {
        // Grace-window rotation: the jar already holds the live refresh token and a user
        // cookie with the right lifetime. Rewriting either would only shorten them.
        return;
    }

    store.set(REFRESH_TOKEN_COOKIE, auth.refreshToken, {
        ...options,
        maxAge: auth.refreshExpiresIn,
    });

    store.set(USER_COOKIE, JSON.stringify(auth.user), {
        ...options,
        maxAge: auth.refreshExpiresIn,
    });
}

/**
 * Decodes a JWT's `exp` without verifying it. This is only a local freshness hint — the
 * backend is the one that actually validates the signature — so no library is warranted.
 */
export function accessTokenExpiryMs(token: string): number {
    try {
        const payload = token.split(".")[1];
        if (!payload) {
            return 0;
        }

        const json = Buffer.from(payload, "base64url").toString("utf8");
        const exp = (JSON.parse(json) as { exp?: number }).exp;

        return typeof exp === "number" ? exp * 1000 : 0;
    } catch {
        return 0;
    }
}

export function clearSessionCookies(store: CookieWriter) {
    store.delete(ACCESS_TOKEN_COOKIE);
    store.delete(REFRESH_TOKEN_COOKIE);
    store.delete(USER_COOKIE);
}
