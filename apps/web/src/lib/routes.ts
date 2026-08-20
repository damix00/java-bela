import type { Locale } from "@/lib/i18n";

/**
 * The auth flow's URLs in one place — the screens link to each other in a
 * loop (sign in ⇄ create account, forgot → check email → reset → sign in),
 * and every one of those hrefs carries the current language.
 */
export const authScreens = {
    signIn: "sign-in",
    signUp: "sign-up",
    forgotPassword: "forgot-password",
    checkEmail: "check-email",
    resetPassword: "reset-password",
    twoFactor: "two-factor",
    username: "username",
    welcome: "welcome",
} as const;

export type AuthScreen = keyof typeof authScreens;

export function authPath(locale: Locale, screen: AuthScreen) {
    return `/${locale}/${authScreens[screen]}`;
}

/**
 * The legal documents. Slugs stay English in every language, the way the auth
 * screens do — one URL per document keeps inbound links and the sign-up
 * checkbox stable no matter which locale someone arrives in.
 */
export const legalPages = {
    terms: "terms",
    privacy: "privacy",
} as const;

export type LegalPage = keyof typeof legalPages;

export function legalPath(locale: Locale, page: LegalPage) {
    return `/${locale}/${legalPages[page]}`;
}

/**
 * The lobby, and the site's front door. Signed out it makes the case for an
 * account; signed in it is one click from a game — which is the whole reason
 * the marketing page moved off this URL.
 */
export function homePath(locale: Locale) {
    return `/${locale}`;
}

/**
 * The marketing page. It used to live at `/[lang]` and is still the indexable
 * one — the sitemap and the `hreflang` alternates point here, and the lobby is
 * `noindex`.
 */
export function landingPath(locale: Locale) {
    return `/${locale}/landing`;
}

export function playPath(locale: Locale, gameId: string) {
    return `/${locale}/play/${gameId}`;
}

/**
 * The query parameter that carries "where they were actually headed" through
 * the sign-in screen. Written by the proxy when it turns someone away, read by
 * the credential screens once they have a session.
 */
export const RETURN_TO_PARAM = "next";

/**
 * The flag the marketing page's CTAs put on their sign-up links.
 *
 * Guest play lives on the sign-in screen, where "I don't want to type
 * credentials right now" is the question actually being asked. Sign-up only
 * offers it to someone who arrived from a landing CTA: they clicked a button
 * that promised a game, and a registration form with no way past it is not
 * what they clicked. Everyone else reaching sign-up came to make an account.
 */
export const GUEST_OFFER_PARAM = "guest";

/** Drops the empty entries, so a path with nothing to carry keeps its bare form. */
function withQuery(
    path: string,
    params: Record<string, string | null | undefined>,
) {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value) query.set(key, value);
    }

    const search = query.toString();

    return search ? `${path}?${search}` : path;
}

type AuthLinkOptions = {
    /** Where to land once there is a session — see `RETURN_TO_PARAM`. */
    returnTo?: string | null;
    /** Whether the guest offer should survive the hop — see `GUEST_OFFER_PARAM`. */
    offerGuest?: boolean;
};

/**
 * An auth screen's URL with the flow's state folded in. The sign-in ⇄ sign-up
 * cross-links go through here so switching screens mid-flow drops neither the
 * table the player was headed for nor the guest offer they arrived with.
 */
export function authLink(
    locale: Locale,
    screen: AuthScreen,
    { returnTo, offerGuest }: AuthLinkOptions = {},
) {
    return withQuery(authPath(locale, screen), {
        [RETURN_TO_PARAM]: returnTo,
        [GUEST_OFFER_PARAM]: offerGuest ? "1" : null,
    });
}

/** Sign-in, with the gated destination folded in. */
export function signInPathWithReturn(locale: Locale, returnTo: string) {
    return authLink(locale, "signIn", { returnTo });
}

/** Sign-up as the marketing page links to it: guest play still on the table. */
export function landingSignUpPath(locale: Locale) {
    return authLink(locale, "signUp", { offerGuest: true });
}

/**
 * Validates a `?next=` value before anything redirects to it.
 *
 * The parameter arrives from the URL bar, so it is attacker-controlled: without
 * this, `?next=https://evil.example` would turn our own sign-in screen into an
 * open redirect, and `?next=/en/sign-in` into a loop. Only a same-origin path
 * under the current locale survives, and never an auth screen — those are the
 * thing being returned *from*.
 *
 * Returns null when there is nothing safe to honour, which callers read as
 * "just go to the lobby".
 */
export function safeReturnPath(
    raw: string | null | undefined,
    locale: Locale,
): string | null {
    if (!raw) return null;

    // A protocol-relative `//evil.example` and a backslash-separated
    // `/\evil.example` are both off-origin, whatever they look like.
    if (!raw.startsWith("/") || raw[1] === "/" || raw[1] === "\\") return null;

    const [, first = "", second = ""] = raw.split(/[?#]/)[0].split("/");
    if (first !== locale) return null;

    const isAuthScreen = (Object.values(authScreens) as string[]).includes(
        second,
    );
    if (isAuthScreen) return null;

    return raw;
}

/**
 * Pulls a validated destination out of a page's `searchParams`. Every credential
 * screen does this the same way, and every one of them must do it on the server:
 * `safeReturnPath` is the only thing standing between `?next=` and an open
 * redirect, so no screen should ever see the raw value.
 */
export function readReturnTo(
    search: Record<string, string | string[] | undefined>,
    locale: Locale,
): string | null {
    const value = search[RETURN_TO_PARAM];

    return safeReturnPath(Array.isArray(value) ? value[0] : value, locale);
}

/**
 * Whether this screen was reached from a landing-page CTA, and so should still
 * offer guest play. Unlike `?next=` there is nothing to validate: the flag only
 * ever adds a button that the sign-in screen shows unconditionally anyway.
 */
export function readGuestOffer(
    search: Record<string, string | string[] | undefined>,
): boolean {
    const value = search[GUEST_OFFER_PARAM];

    return (Array.isArray(value) ? value[0] : value) === "1";
}
