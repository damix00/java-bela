// Locale constants, shared by `proxy.ts` and the app. Deliberately free of
// imports and side effects: the proxy may be deployed to a CDN edge, so
// anything it pulls in has to be trivially serialisable.

export const locales = ["en", "hr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Read by the proxy on entry, written by the language switcher. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string): value is Locale {
    return (locales as readonly string[]).includes(value);
}

/** Human labels for the switcher — each language named in itself. */
export const localeNames: Record<Locale, string> = {
    en: "English",
    hr: "Hrvatski",
};

/**
 * Best supported match for an `Accept-Language` header, or `null` if the
 * visitor asked for nothing we speak.
 *
 * Region is dropped before matching (`hr-BA` counts as `hr`), since we ship one
 * dictionary per language and no regional variants.
 */
export function matchLocale(acceptLanguage: string | null): Locale | null {
    if (!acceptLanguage) return null;

    const ranked = acceptLanguage
        .split(",")
        .map((part) => {
            const [tag, ...params] = part.trim().split(";");
            const q = params
                .map((param) => param.trim())
                .find((param) => param.startsWith("q="));
            // A tag with no q-value is the most preferred one (q defaults to 1).
            const quality = q ? Number.parseFloat(q.slice(2)) : 1;
            return {
                language: tag.trim().toLowerCase().split("-")[0],
                quality: Number.isNaN(quality) ? 0 : quality,
            };
        })
        .filter((entry) => entry.quality > 0)
        // Stable sort keeps header order among equal q-values, which is the
        // order the browser meant.
        .sort((a, b) => b.quality - a.quality);

    for (const entry of ranked) {
        if (isLocale(entry.language)) return entry.language;
    }

    return null;
}
