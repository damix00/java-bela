import { getCurrentUser } from "@/actions/auth";
import AuthGate from "@/components/pages/table/blocks/AuthGate";
import TableMockup from "@/components/pages/table/sections/TableMockup";
import { localePage } from "@/dictionaries";
import { localeMetadata } from "@/lib/metadata";
import { authPath } from "@/lib/routes";

// A personal page, and different for every visitor. The indexable copy that
// used to live on this URL is now at `/[lang]/landing`, which is what the
// sitemap and the language alternates point at.
export const generateMetadata = localeMetadata((dict) => ({
    title: dict.lobby.title,
    robots: { index: false, follow: true },
}));

/**
 * The site's front door, and the lobby.
 *
 * Reading the session cookie opts this route into dynamic rendering, which is
 * the point — the page differs per visitor. The `[lang]` layout's
 * `generateStaticParams` still applies: it constrains *which* locales exist,
 * not how their pages render.
 *
 * The table mockup is the front door for every visitor. Signed-out visitors
 * get the account form over it a second later; signing in keeps the player on
 * the same screen instead of replacing it with a separate lobby placeholder.
 */
export default async function Page({ params }: PageProps<"/[lang]">) {
    const { lang, dict } = await localePage(params);
    const user = await getCurrentUser();

    return (
        <>
            <TableMockup
                copy={dict.table}
                errors={dict.form.errors}
                locale={lang}
            />
            {!user && <AuthGate href={authPath(lang, "signIn")} />}
        </>
    );
}
