import MockLabel from "@/components/pages/table/blocks/MockLabel";
import SuitBadge from "@/components/pages/table/blocks/SuitBadge";
import { mockTable } from "@/components/pages/table/mock-data";
import Logo from "@/components/ui/brand/Logo";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/cn";

/**
 * The signed-in chrome: where you are in the app, and who the app thinks you
 * are.
 *
 * Nothing here is a link. The whole screen is a preview shown to someone who
 * isn't signed in, and a nav that looks live but goes nowhere is worse than one
 * that plainly doesn't move — so these are spans, and the only real control on
 * the table is the one that opens the account form.
 */
export default function MockHeader({ copy }: { copy: Dictionary["table"] }) {
  const tabs = [
    { label: copy.nav.table, active: true },
    { label: copy.nav.ladder, active: false },
    { label: copy.nav.friends, active: false },
    { label: copy.nav.hands, active: false },
  ];

  return (
    <header className="flex items-center gap-6 border-b-4 border-ink bg-ink px-5 py-4 sm:gap-9 md:px-10">
      <Logo withMark tone="cream" />

      <nav aria-hidden className="hidden items-center gap-7 sm:flex">
        {tabs.map((tab) => (
          <MockLabel
            key={tab.label}
            className={cn(
              "pb-[3px] text-[12px]",
              tab.active
                ? "border-b-[3px] border-rust text-cream"
                : "text-ash/80",
            )}
          >
            {tab.label}
          </MockLabel>
        ))}
      </nav>

      <span className="ml-auto flex items-center gap-4">
        <MockLabel className="hidden text-ash md:inline">
          {mockTable.rating} · {mockTable.band}
        </MockLabel>
        <SuitBadge suit={mockTable.you.suit} tone={mockTable.you.tone} />
      </span>
    </header>
  );
}
