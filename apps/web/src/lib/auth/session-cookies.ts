// The session cookie layer: names, options, and the reader/writer pair.
//
// Deliberately free of imports and side effects, for the same reason `i18n.ts`
// is: `proxy.ts` both reads and now writes these cookies, and the proxy is
// bundled apart from the app. Importing `actions/cookies.ts` there would drag
// in `server-only` and the whole Node cookie API.
//
// Nothing secret lives here — cookie names and a base64url decode — so the
// module is safe wherever it lands. The one file that does hold a secret,
// `api/internal.ts`, keeps its `server-only` marker.

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
export const USER_COOKIE = "user";

/**
 * Whether this browser has already answered the post-sign-up profile step —
 * saved or skipped, both count as answered.
 *
 * A cookie rather than `localStorage` because the screen behind it is a server
 * component: the page can turn someone away before rendering, where a value
 * only the browser holds would flash the form and then take it back.
 */
export const WELCOME_COOKIE = "welcome_done";

/**
 * A minimal view of both `cookies()` from next/headers and `response.cookies`
 * from NextResponse, so route handlers, server actions and the proxy share one
 * writer.
 */
export type CookieWriter = {
    set(name: string, value: string, options?: CookieOptions): unknown;
    delete(name: string): unknown;
};

export type CookieOptions = {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
    maxAge?: number;
    path?: string;
};

/** The subset of the backend's auth response that the cookie writer needs. */
type SessionPayload = {
    accessToken: string;
    refreshToken: string | null;
    expiresIn: number;
    refreshExpiresIn: number;
    user: unknown;
};

/**
 * "lax" rather than "strict": strict withholds cookies on top-level cross-site
 * navigation, so following an invite link from a chat app would land the player
 * logged out. Lax still blocks cross-site POSTs, which is what protects the
 * refresh route.
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
 * The refresh token is only written when the backend returned one — on a
 * grace-window rotation it returns null, meaning the token already in the jar is
 * still the live one and must not be clobbered.
 */
export function setSessionCookies(store: CookieWriter, auth: SessionPayload) {
    const options = baseOptions();

    store.set(ACCESS_TOKEN_COOKIE, auth.accessToken, {
        ...options,
        maxAge: auth.expiresIn,
    });

    if (!auth.refreshToken) {
        // Grace-window rotation: the jar already holds the live refresh token and a
        // user cookie with the right lifetime. Rewriting either would only shorten
        // them.
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
 * Refresh-token lifetimes, in seconds, mirroring `app.jwt.refresh-expiration-ms`
 * and `app.jwt.refresh-anonymous-expiration-ms` in the API's
 * `application.properties` — 30 days for an account, 24 hours for a guest.
 *
 * These are duplicated here for one reason: `setUserCookie` below rewrites the
 * user cookie *without* a rotation, so there is no `refreshExpiresIn` in hand to
 * take the lifetime from. Being generous would be safe rather than wrong —
 * `getCurrentUser` gates on the refresh cookie, so a user cookie that outlives
 * it is never read — but matching the real lifetimes keeps a dead guest's name
 * out of the jar for the 29 days after their session ends.
 */
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;
const GUEST_REFRESH_MAX_AGE = 24 * 60 * 60;

/**
 * Rewrites just the user cookie, for a profile edit.
 *
 * `setSessionCookies` cannot serve this: it writes the user only alongside a new
 * refresh token, and a profile save rotates nothing. Without this the cookie
 * would keep serving the old name until the next rotation — and the cookie is
 * what every server render reads the session from.
 */
export function setUserCookie(
    store: CookieWriter,
    user: { email: string | null },
) {
    // An anonymous account has no email, and a shorter session behind it.
    const maxAge =
        user.email === null ? GUEST_REFRESH_MAX_AGE : REFRESH_MAX_AGE;

    store.set(USER_COOKIE, JSON.stringify(user), { ...baseOptions(), maxAge });
}

/**
 * Marks the profile step as answered, for as long as this browser keeps its
 * cookies — ten years, since "don't ask me again" has no natural expiry.
 *
 * It goes out `httpOnly` like the rest: the only reader is the server page that
 * decides whether to render the step at all.
 */
export function setWelcomeDone(store: CookieWriter) {
    store.set(WELCOME_COOKIE, "1", {
        ...baseOptions(),
        maxAge: 10 * 365 * 24 * 60 * 60,
    });
}

/**
 * The welcome flag goes with the session deliberately.
 *
 * Keeping it would mean the second person to sign up on a shared computer never
 * sees the step, because the first one dismissed it. Clearing it gives every
 * account its one offer while the promise stays what it says: dismiss it and it
 * does not come back for that player.
 */
export function clearSessionCookies(store: CookieWriter) {
    store.delete(ACCESS_TOKEN_COOKIE);
    store.delete(REFRESH_TOKEN_COOKIE);
    store.delete(USER_COOKIE);
    store.delete(WELCOME_COOKIE);
}

/**
 * Decodes a JWT's `exp` without verifying it. This is only a local freshness
 * hint — the backend is the one that actually validates the signature — so no
 * library is warranted.
 *
 * `atob` rather than `Buffer`: this runs in the proxy as well as in Node, and
 * the proxy's bundle should not assume a Node global.
 */
export function accessTokenExpiryMs(token: string): number {
    try {
        const payload = token.split(".")[1];
        if (!payload) {
            return 0;
        }

        const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
        const exp = (JSON.parse(json) as { exp?: number }).exp;

        return typeof exp === "number" ? exp * 1000 : 0;
    } catch {
        return 0;
    }
}
