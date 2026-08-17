import type { Metadata } from "next";

import LegalDocument from "@/components/pages/legal/LegalDocument";
import { getLegalDocument } from "@/content/legal";
import { localePage } from "@/dictionaries";
import { legalPath } from "@/lib/routes";
import { locales } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await localePage(params);
  const doc = await getLegalDocument("privacy", lang);

  return {
    title: doc.title,
    description: doc.lede,
    alternates: {
      canonical: legalPath(lang, "privacy"),
      languages: {
        ...Object.fromEntries(
          locales.map((locale) => [locale, legalPath(locale, "privacy")]),
        ),
        "x-default": legalPath("en", "privacy"),
      },
    },
  };
}

export default async function Page({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await localePage(params);

  return <LegalDocument doc={await getLegalDocument("privacy", lang)} />;
}
