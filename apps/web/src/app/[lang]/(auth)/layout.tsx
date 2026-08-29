import Link from "next/link";

import LanguageSwitcher from "@/components/controls/LanguageSwitcher";
import Logo from "@/components/ui/brand/Logo";
import { localePage } from "@/dictionaries";
import { focusRing } from "@/lib/ui/styles";
import { homePath } from "@/lib/navigation/routes";

/**
 * Chrome for every auth screen: a way back to the site and a way to switch
 * language, and nothing else. The site header doesn't come along — a nav bar
 * full of exits belongs on a landing page, not on a form someone is halfway
 * through.
 *
 * "Back to the site" is the marketing page, not the lobby. Anyone reading this
 * chrome is on a credential screen, which mostly means they have no session —
 * and the lobby would only turn them straight back around to the form they
 * just left.
 */
export default async function AuthLayout({
    children,
    params,
}: LayoutProps<"/[lang]">) {
    const { lang, dict } = await localePage(params);

    return (
        <main className="flex min-h-dvh flex-col gap-10 px-5 py-8 sm:px-8 sm:py-12">
            <div className="mx-auto flex w-full max-w-[1080px] items-center gap-4">
                <Link
                    href={homePath(lang)}
                    className={`${focusRing} no-underline`}
                >
                    <Logo />
                </Link>
                {/* Hard navigation: these pages have intercepting twins under
                    `@modal`, and a routed language swap would reopen the very
                    screen you are on as a modal stacked over itself. */}
                <LanguageSwitcher
                    current={lang}
                    label={dict.nav.languageLabel}
                    hardNavigation
                    className="ml-auto"
                />
            </div>
            <div className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col justify-center">
                {children}
            </div>
        </main>
    );
}
