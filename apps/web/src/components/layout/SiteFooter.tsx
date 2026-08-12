import Logo from "@/components/ui/brand/Logo";
import TextLink from "@/components/ui/typography/TextLink";
import type { Dictionary } from "@/dictionaries";

type SiteFooterProps = {
  copy: Dictionary["footer"];
};

export default function SiteFooter({ copy }: SiteFooterProps) {
  const footerLinks = [
    { href: "#ranked", label: copy.rules },
    { href: "#faq", label: copy.faq },
    { href: "#waitlist", label: copy.contact },
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
