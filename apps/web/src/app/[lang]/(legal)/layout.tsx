import Link from "next/link";

import LanguageSwitcher from "@/components/controls/LanguageSwitcher";
import SiteFooter from "@/components/layout/SiteFooter";
import Logo from "@/components/ui/brand/Logo";
import { localePage } from "@/dictionaries";
import { landingPath } from "@/lib/routes";
import { focusRing } from "@/lib/styles";

/**
 * Chrome for the legal pages. `SiteHeader` doesn't come along: its nav is
 * in-page anchors for the landing page, and `#ranked` from here would be a
 * link to nothing. Keep the logo, language control, and footer because most
 * people will have clicked in from.
 *
 * The logo points at the marketing page rather than the lobby for the same
 * reason it does on the auth screens: these documents are read by signed-out
 * visitors, and the lobby has nothing to show them.
 */
export default async function LegalLayout({
    children,
    params,
}: LayoutProps<"/[lang]">) {
    const { lang, dict } = await localePage(params);

    return (
        <>
            <header className="sticky top-0 z-20 flex items-center gap-[30px] border-b-4 border-ink bg-sage px-8 py-4 md:px-28 md:py-5 lg:px-48 xl:px-72">
                <Link
                    href={landingPath(lang)}
                    className={`${focusRing} mr-auto no-underline`}
                >
                    <Logo withMark />
                </Link>
            </header>
            <main lang="en">{children}</main>
            <SiteFooter copy={dict.footer} locale={lang} />
        </>
    );
}
