import type { MetadataRoute } from "next";

import { locales } from "@/lib/i18n";

const SITE_URL = "https://belote.gg";

/**
 * Lists every locale as its own entry with the full set of language
 * alternates. This is what keeps the `/` detection redirect out of the SEO
 * path — a crawler reaches both languages straight from here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, `${SITE_URL}/${locale}`]),
  );

  return locales.map((locale) => ({
    url: `${SITE_URL}/${locale}`,
    lastModified: new Date(),
    alternates: { languages },
  }));
}
