import { lift, underline } from "@/components/pages/home/styles";
import { cn } from "@/lib/cn";

const navLinks = [
  { href: "#ranked", label: "Ranked" },
  { href: "#play", label: "How it plays" },
  { href: "#faq", label: "FAQ" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-[30px] border-b-4 border-ink bg-sage px-5 py-4 md:px-14 md:py-5">
      <div className="mr-auto flex items-center gap-[11px]">
        <div className="grid size-9 -rotate-6 place-items-center bg-ink text-[19px] text-cream">
          ♠
        </div>
        <span className="font-display text-[21px] font-extrabold tracking-[-.02em]">
          belote.gg
        </span>
      </div>
      {navLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={cn(
            underline,
            "hidden text-[15px] font-semibold text-ink hover:text-ink md:inline",
          )}
        >
          {link.label}
        </a>
      ))}
      <a
        href="#waitlist"
        className={cn(
          lift,
          "border-[3px] border-ink bg-rust px-5 py-[11px] font-display text-[15px] font-extrabold text-cream no-underline shadow-hard-sm hover:text-cream",
        )}
      >
        Join the waitlist
      </a>
    </header>
  );
}
