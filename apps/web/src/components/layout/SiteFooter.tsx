import Logo from "@/components/ui/brand/Logo";
import TextLink from "@/components/ui/typography/TextLink";

const footerLinks = [
  { href: "#ranked", label: "Rules of Bela" },
  { href: "#faq", label: "FAQ" },
  { href: "#waitlist", label: "Contact" },
];

export default function SiteFooter() {
  return (
    <footer className="flex flex-wrap items-center gap-[26px] bg-ink px-8 py-7 md:px-28 lg:px-48 xl:px-72">
      <Logo tone="cream" className="mr-auto" />
      {footerLinks.map((link) => (
        <TextLink key={link.label} href={link.href} tone="ash">
          {link.label}
        </TextLink>
      ))}
    </footer>
  );
}
