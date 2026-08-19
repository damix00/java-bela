import Link from "next/link";

import LanguageSwitcher from "@/components/controls/LanguageSwitcher";
import Logo from "@/components/ui/brand/Logo";
import { localePage } from "@/dictionaries";
import { focusRing } from "@/lib/styles";
import { homePath } from "@/lib/routes";

/**
 * Chrome for every auth screen: a way back to the site and a way to switch
 * language, and nothing else. The site header doesn't come along — a nav bar
 * full of exits belongs on a landing page, not on a form someone is halfway
 * through.
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
                    <Logo withMark />
                </Link>
                <LanguageSwitcher
                    current={lang}
                    label={dict.nav.languageLabel}
                    className="ml-auto"
                />
            </div>
            <div className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col justify-center">
                {children}
            </div>
        </main>
    );
}
