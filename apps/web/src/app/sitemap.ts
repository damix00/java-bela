import type { MetadataRoute } from "next";

import { locales, type Locale } from "@/lib/i18n";
import { landingPath, legalPages, legalPath, type LegalPage } from "@/lib/routes";

const SITE_URL = "https://belote.gg";

/**
 * Lists every page in every locale, each carrying the full set of language
 * alternates. This is what keeps the `/` detection redirect out of the SEO
 * path — a crawler reaches both languages straight from here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // Built from the same route helpers the app links with, so a new language or
  // a third legal document lands in the sitemap without touching this file.
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
    // The marketing page, not the bare locale root — that URL is the lobby now,
    // which is personal and marked `noindex`.
    ...localised(landingPath),
    ...(Object.keys(legalPages) as LegalPage[]).flatMap((page) =>
      localised((locale) => legalPath(locale, page)),
    ),
  ];
}
