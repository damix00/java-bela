import "server-only";

// Everything here lives in an import-free module so the proxy can read *and*
// write the session cookies without pulling this file's `server-only`
// dependency in with them. Server actions and route handlers keep importing
// from this path, which is where the rest of the server code expects them.
export {
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    USER_COOKIE,
    accessTokenExpiryMs,
    clearSessionCookies,
    setSessionCookies,
    setUserCookie,
    type CookieOptions,
    type CookieWriter,
} from "@/lib/auth/session-cookies";
