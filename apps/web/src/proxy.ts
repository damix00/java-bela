import { NextResponse, type NextRequest } from "next/server";

import {
    LOCALE_COOKIE,
    defaultLocale,
    isLocale,
    matchLocale,
    type Locale,
} from "@/lib/i18n/config";
import {
    authPath,
    homePath,
    safeReturnPath,
    signInPathWithReturn,
} from "@/lib/navigation/routes";
import {
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    accessTokenExpiryMs,
    clearSessionCookies,
    setSessionCookies,
} from "@/lib/auth/session-cookies";
import { verifySession } from "@/lib/auth/session-verify";

/**
 * Two jobs.
 *
 * First, sends locale-less requests to a locale-prefixed URL. Every rendered
 * page lives under `/[lang]`, so this is what makes a bare `/` work.
 *
 * The redirect is deliberately **307, not 301**: a permanent redirect would
 * teach crawlers that `/` *is* the detected locale, hiding the other language.
 * Temporary keeps `/en` and `/hr` equal citizens — both are linked from the
 * sitemap and cross-declared with `hreflang`, so no crawler has to pass
 * through this detection at all.
 *
 * Second, keeps anyone without a live session out of the sections that need
 * one, and remembers where they were going.
 */
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const [, firstSegment = "", section = ""] = pathname.split("/");

    if (!isLocale(firstSegment)) {
        const url = request.nextUrl.clone();
        url.pathname = `/${resolveLocale(request)}${pathname}`;
        return NextResponse.redirect(url, 307);
    }

    if (!isGated(section)) {
        return;
    }

    return guard(request, firstSegment);
}

/**
 * Sections that cannot render without a session.
 *
 * A table needs an account — or at least a guest one. `welcome` and `username`
 * are the tail of a flow that has *already* produced a session and are reached
 * because you are signed in, so arriving at either without one is equally a
 * dead end.
 *
 * The lobby — the empty section, `/[lang]` itself — is gated here rather than
 * by its own `redirect()`, and it has to be. A redirect issued *during* a
 * client-side navigation is performed by the router as another client-side
 * navigation, which means `@modal/(.)sign-in` intercepts it: the sign-in form
 * comes back as a modal laid over the lobby that redirected, the lobby is
 * still session-less, and it redirects again. That ping-pong runs until the
 * browser refuses the `history.replaceState()` behind it. Turning the visitor
 * away out here, before the lobby renders at all, is what breaks the cycle.
 *
 * `profile` and `settings` are the account's own pages: there is nothing on
 * either of them to render for someone without a session, and `?next=` brings
 * them back to the one they asked for.
 *
 * `join` is an invite link arriving from outside — a chat app, usually — and it
 * needs a session before it can take a seat. Gating it here is what makes
 * `?next=` carry the table through sign-in, so someone who clicks a friend's
 * link while signed out lands back on that lobby rather than on the front door
 * with the code lost.
 */
const gatedSections = new Set([
    "",
    "play",
    "welcome",
    "username",
    "join",
    "profile",
    "settings",
]);

function isGated(section: string) {
    return gatedSections.has(section);
}

/**
 * The auth check, in cost order.
 *
 * Presence of the refresh cookie is free, an unexpired access token is a local
 * base64 decode, and only when both of those come up short does anything touch
 * the network. That ordering is the whole design: the proxy runs on every
 * matched request, prefetches included, so the backend is asked at most once per
 * access-token lifetime rather than once per navigation.
 *
 * **A backend that cannot answer fails open.** Only an outright 401 ends a
 * session here. Treating a timeout or a 502 as a sign-out would mean one bad
 * minute on the API logging out every player mid-game, which is a far worse
 * failure than briefly admitting someone whose token was revoked seconds ago —
 * the page behind this still reads the session itself, and every authenticated
 * call still has to satisfy the backend.
 */
async function guard(request: NextRequest, locale: Locale) {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    if (!refreshToken) {
        return signOut(request, locale);
    }

    const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
    if (accessToken && accessTokenExpiryMs(accessToken) > Date.now()) {
        return;
    }

    const check = await verifySession(refreshToken);

    if (check.state === "rejected") {
        return signOut(request, locale, { clearCookies: true });
    }

    if (check.state === "unavailable") {
        return;
    }

    // The rotation that proved the session is also a fresh one, so the cookies go
    // out with this response rather than being thrown away and re-fetched by the
    // page. Without this the very next request would verify all over again.
    const response = NextResponse.next();
    setSessionCookies(response.cookies, check.session);
    return response;
}

/**
 * Turns someone away, carrying their destination along.
 *
 * `safeReturnPath` is what decides whether the destination is worth carrying:
 * for `/play/:id` it is, and they land back at the table once they have an
 * account. For `welcome` and `username` it is not — those are auth screens, and
 * returning to one is a loop — so those visitors get the plain sign-in screen,
 * as does anyone who was only ever headed for the lobby.
 */
function signOut(
    request: NextRequest,
    locale: Locale,
    { clearCookies = false } = {},
) {
    const { pathname, search } = request.nextUrl;
    const candidate = safeReturnPath(`${pathname}${search}`, locale);
    // The lobby is already where sign-in lands when nothing else is asked for,
    // so carrying it as `?next=` would only make the URL longer.
    const returnTo = candidate === homePath(locale) ? null : candidate;

    const destination = returnTo
        ? signInPathWithReturn(locale, returnTo)
        : authPath(locale, "signIn");

    const response = NextResponse.redirect(new URL(destination, request.url));

    if (clearCookies) {
        clearSessionCookies(response.cookies);
    }

    return response;
}

/**
 * An explicit choice outranks the browser's preference — someone who picked a
 * language from the switcher meant it, whatever their headers say.
 */
function resolveLocale(request: NextRequest) {
    const chosen = request.cookies.get(LOCALE_COOKIE)?.value;
    if (chosen && isLocale(chosen)) return chosen;

    return matchLocale(request.headers.get("accept-language")) ?? defaultLocale;
}

export const config = {
    // Everything except Next internals, API routes and files with an extension —
    // without this, CSS, JS and images would be redirected too.
    matcher: ["/((?!_next|api|.*\\..*).*)"],
};
