import { cache } from "react";

import type { Locale } from "@/lib/i18n";
import type { LegalPage } from "@/lib/routes";

import type { LegalDocument } from "./types";

// Lazy, like the dictionaries: rendering the terms in Croatian shouldn't pull
// the English privacy policy into the same server bundle.
const documents: Record<
  LegalPage,
  Record<Locale, () => Promise<LegalDocument>>
> = {
  terms: {
    en: () => import("./terms.en").then((module) => module.default),
    hr: () => import("./terms.hr").then((module) => module.default),
  },
  privacy: {
    en: () => import("./privacy.en").then((module) => module.default),
    hr: () => import("./privacy.hr").then((module) => module.default),
  },
};

/** Memoised so a route can read the document from `generateMetadata` too. */
export const getLegalDocument = cache(
  (page: LegalPage, locale: Locale): Promise<LegalDocument> =>
    documents[page][locale](),
);
