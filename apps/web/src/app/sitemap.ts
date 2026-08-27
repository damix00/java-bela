import type { MetadataRoute } from "next";

import { locales, type Locale } from "@/lib/i18n/config";
import {
    landingPath,
    legalPages,
    legalPath,
    type LegalPage,
} from "@/lib/navigation/routes";

const SITE_URL = "https://belote.gg";

/**
 * Lists public pages and their genuine language alternates. This keeps the `/`
 * detection redirect out of the SEO path because crawlers receive direct URLs.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();

    // Product pages have a distinct translation for every locale.
    const localised = (path: (locale: Locale) => string) =>
        locales.map((locale) => ({
            url: `${SITE_URL}${path(locale)}`,
            lastModified,
            alternates: {
                languages: Object.fromEntries(
                    locales.map((alternate) => [
                        alternate,
                        `${SITE_URL}${path(alternate)}`,
                    ]),
                ),
            },
        }));

    return [
        // The marketing page, not the bare locale root. That URL is the lobby now,
        // which is personal and marked `noindex`.
        ...localised(landingPath),
        // Legal documents are issued only in English. Croatian-prefixed legal URLs
        // remain navigable but canonicalize to these English entries.
        ...(Object.keys(legalPages) as LegalPage[]).map((page) => ({
            url: `${SITE_URL}${legalPath("en", page)}`,
            lastModified,
            alternates: {
                languages: {
                    en: `${SITE_URL}${legalPath("en", page)}`,
                    "x-default": `${SITE_URL}${legalPath("en", page)}`,
                },
            },
        })),
    ];
}
