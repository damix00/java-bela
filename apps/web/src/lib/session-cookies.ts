// Session cookie names, and nothing else. Deliberately free of imports and side
// effects, for the same reason `i18n.ts` is: `proxy.ts` reads the refresh cookie
// to gate `/play`, and the proxy may be deployed to a CDN edge. Importing
// `actions/cookies.ts` there would drag in `server-only` and the whole Node
// cookie API.
//
// The reader and the writer therefore share these constants without sharing a
// runtime.

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
export const USER_COOKIE = "user";
