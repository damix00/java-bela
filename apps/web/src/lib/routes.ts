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
