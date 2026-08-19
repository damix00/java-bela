import Logo from "@/components/ui/brand/Logo";
import TextLink from "@/components/ui/typography/TextLink";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { landingPath, legalPath } from "@/lib/routes";

type SiteFooterProps = {
    copy: Dictionary["footer"];
    locale: Locale;
};

export default function SiteFooter({ copy, locale }: SiteFooterProps) {
    const landing = landingPath(locale);

    // The anchors carry the landing path rather than standing alone: this footer
    // also sits under the legal pages, where a bare `#faq` would be a link to
    // nothing — and the sections it points at live on `/landing`, not on the
    // lobby that now occupies the locale root.
    const footerLinks = [
        { href: `${landing}#ranked`, label: copy.rules },
        { href: `${landing}#faq`, label: copy.faq },
        { href: `${landing}#join`, label: copy.contact },
        { href: legalPath(locale, "terms"), label: copy.terms },
        { href: legalPath(locale, "privacy"), label: copy.privacy },
    ];

    return (
        <footer className="flex flex-wrap items-center gap-[26px] bg-ink px-8 py-7 md:px-28 lg:px-48 xl:px-72">
            <Logo tone="cream" className="mr-auto" />
            {footerLinks.map((link) => (
                <TextLink key={link.href} href={link.href} tone="ash">
                    {link.label}
                </TextLink>
            ))}
        </footer>
    );
}
