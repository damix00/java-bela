export const ADMIN_ACCESS_TOKEN_COOKIE = "admin_access_token";
export const ADMIN_REFRESH_TOKEN_COOKIE = "admin_refresh_token";

export type CookieWriter = {
    set(name: string, value: string, options?: CookieOptions): unknown;
    delete(name: string): unknown;
};

type CookieOptions = {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "strict";
    maxAge?: number;
    path?: string;
};

type SessionPayload = {
    accessToken: string;
    refreshToken: string | null;
    expiresIn: number;
    refreshExpiresIn: number;
};

function cookieOptions(): CookieOptions {
    return {
        httpOnly: true,
        secure: process.env.SECURE_COOKIES === "true",
        sameSite: "strict",
        path: "/",
    };
}

export function setAdminSessionCookies(
    store: CookieWriter,
    session: SessionPayload,
) {
    const options = cookieOptions();

    store.set(ADMIN_ACCESS_TOKEN_COOKIE, session.accessToken, {
        ...options,
        maxAge: session.expiresIn,
    });

    if (session.refreshToken) {
        store.set(ADMIN_REFRESH_TOKEN_COOKIE, session.refreshToken, {
            ...options,
            maxAge: session.refreshExpiresIn,
        });
    }
}

export function clearAdminSessionCookies(store: CookieWriter) {
    store.delete(ADMIN_ACCESS_TOKEN_COOKIE);
    store.delete(ADMIN_REFRESH_TOKEN_COOKIE);
}

export function accessTokenExpiryMs(token: string): number {
    try {
        const payload = token.split(".")[1];
        if (!payload) return 0;

        const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
        const exp = (JSON.parse(json) as { exp?: number }).exp;
        return typeof exp === "number" ? exp * 1000 : 0;
    } catch {
        return 0;
    }
}
