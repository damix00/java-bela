import { mockFan } from "@/components/pages/table/mock-data";
import { cn } from "@/lib/cn";

// Splayed by hand rather than computed: three cards is not a fan worth writing
// a formula for, and the middle one sitting a touch proud of its neighbours is
// what stops the group reading as a stack.
const positions = [
  "-rotate-[13deg] -translate-x-[38px] translate-y-[6px]",
  "translate-y-[-4px]",
  "rotate-[13deg] translate-x-[38px] translate-y-[6px]",
] as const;

/** Three cards face-up in the middle of the felt. Pure ornament. */
export default function CardFan() {
  return (
    <div
      aria-hidden
      className="relative flex h-[104px] w-[180px] items-center justify-center"
    >
      {mockFan.map((card, index) => (
        <span
          key={card.suit}
          className={cn(
            "absolute grid h-[90px] w-[64px] place-items-center",
            "border-[3px] border-ink bg-paper text-[27px] leading-none shadow-hard-sm",
            card.red ? "text-rust" : "text-ink",
            positions[index],
          )}
        >
          {card.suit}
        </span>
      ))}
    </div>
  );
}
