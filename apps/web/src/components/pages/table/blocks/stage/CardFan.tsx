import { mockFan } from "@/components/pages/table/mock-data";
import { cn } from "@/lib/ui/cn";

// Splayed by hand rather than computed: three cards is not a fan worth writing
// a formula for, and the middle one sitting a touch proud of its neighbours is
// what stops the group reading as a stack.
//
// The phone tier is drawn to the felt it sits on rather than to taste: the side
// seats take their width out of the middle column, which leaves the felt about
// 136px across on the narrowest screens, and a fan wider than that would be
// clipped by the felt's own `overflow-hidden`.
//
// The box is sized to the *rotated* cards, not the upright ones — a 13° tilt
// spends a card's width on its height (`h·cos13 + w·sin13`), and a box cut to
// the upright figure lets the outer two push out of it and into the line of
// type underneath.
const positions = [
    "-rotate-[13deg] -translate-x-[20px] translate-y-[3px] desk:-translate-x-[38px] desk:translate-y-[6px]",
    "-translate-y-[2px] desk:-translate-y-[4px]",
    "rotate-[13deg] translate-x-[20px] translate-y-[3px] desk:translate-x-[38px] desk:translate-y-[6px]",
] as const;

/** Three cards face-up in the middle of the felt. Pure ornament. */
export default function CardFan() {
    return (
        <div
            aria-hidden
            className="relative flex h-[62px] w-[102px] items-center justify-center portrait-sm:h-[50px] desk:h-[104px] desk:w-[180px]"
        >
            {mockFan.map((card, index) => (
                <span
                    key={card.suit}
                    className={cn(
                        "absolute grid h-[48px] w-[34px] place-items-center portrait-sm:h-[38px] portrait-sm:w-[28px] desk:h-[90px] desk:w-[64px]",
                        "rounded-[4px] bg-cream text-[18px] leading-none shadow-[0_2px_6px_rgb(0_0_0_/_0.35)] desk:text-[27px]",
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
