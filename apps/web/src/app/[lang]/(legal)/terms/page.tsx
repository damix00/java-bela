import type { Metadata } from "next";

import LegalDocument from "@/components/pages/legal/LegalDocument";
import { getLegalDocument } from "@/content/legal";
import { localePage } from "@/dictionaries";
import { legalPath } from "@/lib/routes";
import { locales } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/terms">): Promise<Metadata> {
  const { lang } = await localePage(params);
  const doc = await getLegalDocument("terms", lang);

  return {
    title: doc.title,
    description: doc.lede,
    alternates: {
      canonical: legalPath(lang, "terms"),
      languages: {
        ...Object.fromEntries(
          locales.map((locale) => [locale, legalPath(locale, "terms")]),
        ),
        "x-default": legalPath("en", "terms"),
      },
    },
  };
}

export default async function Page({ params }: PageProps<"/[lang]/terms">) {
  const { lang } = await localePage(params);

  return <LegalDocument doc={await getLegalDocument("terms", lang)} />;
}
