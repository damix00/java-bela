import LegalDocument from "@/components/pages/legal/LegalDocument";
import { getLegalDocument } from "@/content/legal";
import { localePage } from "@/dictionaries";
import { localeMetadata } from "@/lib/i18n/metadata";
import { legalPath } from "@/lib/navigation/routes";

export const generateMetadata = localeMetadata(async () => {
    const doc = await getLegalDocument("terms");

    return {
        title: doc.title,
        description: doc.lede,
        alternates: {
            canonical: legalPath("en", "terms"),
            languages: {
                en: legalPath("en", "terms"),
                "x-default": legalPath("en", "terms"),
            },
        },
    };
});

export default async function Page({ params }: PageProps<"/[lang]/terms">) {
    await localePage(params);

    return <LegalDocument doc={await getLegalDocument("terms")} />;
}
