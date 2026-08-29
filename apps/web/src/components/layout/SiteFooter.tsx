import Logo from "@/components/ui/brand/Logo";
import TextLink from "@/components/ui/typography/TextLink";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { legalPath } from "@/lib/navigation/routes";

type SiteFooterProps = {
    copy: Dictionary["footer"];
    locale: Locale;
};

export default function SiteFooter({ copy, locale }: SiteFooterProps) {
    // Rules, FAQ and contact were anchors into sections of `/landing`. That page is
    // temporarily removed, so they would each be a link to nothing — they come back
    // with it. The legal documents are pages in their own right and stay.
    const footerLinks = [
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
