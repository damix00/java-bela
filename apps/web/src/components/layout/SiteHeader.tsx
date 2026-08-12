import { ButtonLink } from "@/components/controls/Button";
import Logo from "@/components/ui/brand/Logo";
import TextLink from "@/components/ui/typography/TextLink";

const navLinks = [
  { href: "#ranked", label: "Ranked" },
  { href: "#faq", label: "FAQ" },
];

export default function SiteHeader() {
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
      <ButtonLink href="#waitlist" size="sm">
        Join the waitlist
      </ButtonLink>
    </header>
  );
}
