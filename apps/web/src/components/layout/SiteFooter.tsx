import { underline } from "@/components/pages/home/styles";
import { cn } from "@/lib/cn";

const footerLinks = [
  { href: "#ranked", label: "Rules of Bela" },
  { href: "#faq", label: "FAQ" },
  { href: "#waitlist", label: "Contact" },
];

export default function SiteFooter() {
  return (
    <footer className="flex flex-wrap items-center gap-[26px] bg-ink px-5 py-7 md:px-14">
      <span className="mr-auto font-display text-[20px] font-extrabold text-cream">
        belote.gg
      </span>
      {footerLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          className={cn(underline, "text-[15px] text-ash hover:text-cream")}
        >
          {link.label}
        </a>
      ))}
    </footer>
  );
}
