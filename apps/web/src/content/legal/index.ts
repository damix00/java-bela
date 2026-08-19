import { cache } from "react";

import type { LegalPage } from "@/lib/routes";

import type { LegalDocument } from "./types";

// The product remains localized, but its legal documents are issued only in
// English. Keep each document lazy so terms pages do not load the privacy copy.
const documents: Record<LegalPage, () => Promise<LegalDocument>> = {
    terms: () => import("./terms.en").then((module) => module.default),
    privacy: () => import("./privacy.en").then((module) => module.default),
};

/** Memoised so a route can read the document from `generateMetadata` too. */
export const getLegalDocument = cache(
    (page: LegalPage): Promise<LegalDocument> => documents[page](),
);
