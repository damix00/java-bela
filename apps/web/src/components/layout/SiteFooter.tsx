import Logo from "@/components/ui/brand/Logo";
import TextLink from "@/components/ui/typography/TextLink";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { homePath, legalPath } from "@/lib/routes";

type SiteFooterProps = {
  copy: Dictionary["footer"];
  locale: Locale;
};

export default function SiteFooter({ copy, locale }: SiteFooterProps) {
  const home = homePath(locale);

  // The landing-page anchors carry the home path rather than standing alone:
  // this footer also sits under the legal pages, where a bare `#faq` would be
  // a link to nothing.
  const footerLinks = [
    { href: `${home}#ranked`, label: copy.rules },
    { href: `${home}#faq`, label: copy.faq },
    { href: `${home}#join`, label: copy.contact },
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
