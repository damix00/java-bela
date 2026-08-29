import type { MetadataRoute } from "next";

import { legalPages, legalPath, type LegalPage } from "@/lib/navigation/routes";

const SITE_URL = "https://belote.gg";

/**
 * Lists public pages and their genuine language alternates. This keeps the `/`
 * detection redirect out of the SEO path because crawlers receive direct URLs.
 *
 * Only the legal documents are listed at the moment. The marketing page that
 * carried the localised entries is temporarily removed, and the bare locale
 * root is the lobby — personal, and marked `noindex`. The per-locale helper
 * that built those entries comes back with the page.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();

    // Legal documents are issued only in English. Croatian-prefixed legal URLs
    // remain navigable but canonicalize to these English entries.
    return (Object.keys(legalPages) as LegalPage[]).map((page) => ({
        url: `${SITE_URL}${legalPath("en", page)}`,
        lastModified,
        alternates: {
            languages: {
                en: `${SITE_URL}${legalPath("en", page)}`,
                "x-default": `${SITE_URL}${legalPath("en", page)}`,
            },
        },
    }));
}
