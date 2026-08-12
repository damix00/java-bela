import { ButtonLink } from "@/components/controls/Button";
import LanguageSwitcher from "@/components/controls/LanguageSwitcher";
import Logo from "@/components/ui/brand/Logo";
import TextLink from "@/components/ui/typography/TextLink";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";

type SiteHeaderProps = {
  copy: Dictionary["nav"];
  locale: Locale;
};

export default function SiteHeader({ copy, locale }: SiteHeaderProps) {
  const navLinks = [
    { href: "#ranked", label: copy.ranked },
    { href: "#faq", label: copy.faq },
  ];

  return (
    <header className="sticky top-0 z-20 flex items-center gap-[30px] border-b-4 border-ink bg-sage px-8 py-4 md:px-28 md:py-5 lg:px-48 xl:px-72">
      <Logo withMark className="mr-auto" />
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
          + CTA don't fit a phone. The hero's own form sits just below the fold,
          so this is the one that gives way. */}
      <ButtonLink href="#waitlist" size="sm" className="hidden sm:inline-block">
        {copy.cta}
      </ButtonLink>
    </header>
  );
}
