import { ButtonLink } from "@/components/controls/Button";
import LanguageSwitcher from "@/components/controls/LanguageSwitcher";
import Logo from "@/components/ui/brand/Logo";
import TextLink from "@/components/ui/typography/TextLink";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { landingSignUpPath } from "@/lib/navigation/routes";

type SiteHeaderProps = {
    copy: Dictionary["nav"];
    cta: Dictionary["cta"];
    locale: Locale;
};

export default function SiteHeader({ copy, cta, locale }: SiteHeaderProps) {
    const navLinks = [
        { href: "#ranked", label: copy.ranked },
        { href: "#faq", label: copy.faq },
    ];

    return (
        <header className="sticky top-0 z-20 flex items-center gap-[30px] border-b-4 border-ink bg-sage px-8 py-4 md:px-28 md:py-5 lg:px-48 xl:px-72">
            <Logo className="mr-auto" />
            {navLinks.map((link) => (
                <TextLink
                    key={link.href}
                    href={link.href}
                    weight="semibold"
                    className="hidden md:inline"
                >
                    {link.label}
                </TextLink>
            ))}
            <LanguageSwitcher current={locale} label={copy.languageLabel} />
            {/* The switcher has to stay reachable at every width, and logo + switcher
          + both CTAs don't fit a phone. The hero carries the same pair just
          below the fold, so these are what give way. */}
            <ButtonLink
                href={landingSignUpPath(locale)}
                size="sm"
                className="hidden sm:inline-block"
            >
                {cta.getStarted}
            </ButtonLink>
        </header>
    );
}
