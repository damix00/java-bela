import LegalDocument from "@/components/pages/legal/LegalDocument";
import { getLegalDocument } from "@/content/legal";
import { localePage } from "@/dictionaries";
import { localeMetadata } from "@/lib/i18n/metadata";
import { legalPath } from "@/lib/navigation/routes";

export const generateMetadata = localeMetadata(async () => {
    const doc = await getLegalDocument("privacy");

    return {
        title: doc.title,
        description: doc.lede,
        alternates: {
            canonical: legalPath("en", "privacy"),
            languages: {
                en: legalPath("en", "privacy"),
                "x-default": legalPath("en", "privacy"),
            },
        },
    };
});

export default async function Page({ params }: PageProps<"/[lang]/privacy">) {
    await localePage(params);

    return <LegalDocument doc={await getLegalDocument("privacy")} />;
}
