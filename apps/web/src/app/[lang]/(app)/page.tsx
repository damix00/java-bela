import { redirect } from "next/navigation";

import { getCurrentUser } from "@/actions/auth";
import { isGuest } from "@/api/types/user";
import TableScreen from "@/components/pages/table/sections/TableScreen";
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
 * The table is the front door for anyone with a session, guests included.
 * Signed-out visitors get the sign-in screen as a page of its own
 * rather than a dialog that opens itself over a lobby they cannot use: a form
 * that arrives uninvited over live content reads as an interruption, and this
 * one would be covering the only thing on the screen. The modal twin of that
 * route still exists — it is what a *click* from inside the app opens.
 */
export default async function Page({ params }: PageProps<"/[lang]">) {
    const { lang, dict } = await localePage(params);
    const user = await getCurrentUser();

    if (!user) {
        redirect(authPath(lang, "signUp"));
    }

    return (
        <TableScreen
            copy={dict.table}
            locale={lang}
            user={user}
            guest={isGuest(user)}
            signUpHref={authPath(lang, "signUp")}
        />
    );
}
