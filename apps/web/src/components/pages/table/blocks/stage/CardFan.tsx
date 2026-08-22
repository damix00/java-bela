import { mockFan } from "@/components/pages/table/mock-data";
import { cn } from "@/lib/cn";

// Splayed by hand rather than computed: three cards is not a fan worth writing
// a formula for, and the middle one sitting a touch proud of its neighbours is
// what stops the group reading as a stack.
const positions = [
    "-rotate-[13deg] -translate-x-[28px] translate-y-[4px] sm:-translate-x-[38px] sm:translate-y-[6px]",
    "-translate-y-[3px] sm:-translate-y-[4px]",
    "rotate-[13deg] translate-x-[28px] translate-y-[4px] sm:translate-x-[38px] sm:translate-y-[6px]",
] as const;

/** Three cards face-up in the middle of the felt. Pure ornament. */
export default function CardFan() {
    return (
        <div
            aria-hidden
            className="relative flex h-[78px] w-[136px] items-center justify-center sm:h-[104px] sm:w-[180px]"
        >
            {mockFan.map((card, index) => (
                <span
                    key={card.suit}
                    className={cn(
                        "absolute grid h-[68px] w-[48px] place-items-center sm:h-[90px] sm:w-[64px]",
                        "border-[3px] border-ink bg-paper text-[22px] leading-none shadow-hard-sm sm:text-[27px]",
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
