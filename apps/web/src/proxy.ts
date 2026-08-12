import { NextResponse, type NextRequest } from "next/server";

import { LOCALE_COOKIE, defaultLocale, isLocale, matchLocale } from "@/lib/i18n";

/**
 * Sends locale-less requests to a locale-prefixed URL. Every rendered page
 * lives under `/[lang]`, so this is what makes a bare `/` work.
 *
 * The redirect is deliberately **307, not 301**: a permanent redirect would
 * teach crawlers that `/` *is* the detected locale, hiding the other language.
 * Temporary keeps `/en` and `/hr` equal citizens — both are linked from the
 * sitemap and cross-declared with `hreflang`, so no crawler has to pass
 * through this detection at all.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const [, firstSegment = ""] = pathname.split("/");
  if (isLocale(firstSegment)) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${resolveLocale(request)}${pathname}`;
  return NextResponse.redirect(url, 307);
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
