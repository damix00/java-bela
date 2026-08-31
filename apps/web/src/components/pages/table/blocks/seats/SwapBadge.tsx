import { ArrowLeftRight } from "lucide-react";

import { cn } from "@/lib/ui/cn";

type SwapBadgeProps = {
    size?: "sm" | "md";
    className?: string;
};

/**
 * The mark that says a seat can be pressed.
 *
 * Hover is where an affordance like this would normally live, and half the
 * table is played on a phone, which has none — so the badge is drawn
 * unconditionally on every seat the reader can move into. It is boxed in the
 * same 3px ink rule as the suit tile and the seat tags, so it reads as another
 * mark on the card rather than as a control welded onto one.
 *
 * Decorative: the seat's own `actionLabel` already says what pressing it does.
 */
export default function SwapBadge({ size = "md", className }: SwapBadgeProps) {
    return (
        <span
            aria-hidden
            className={cn(
                "grid shrink-0 place-items-center rounded-full bg-cream text-ink",
                size === "md" ? "size-9" : "size-6",
                className,
            )}
        >
            <ArrowLeftRight
                size={size === "md" ? 16 : 12}
                strokeWidth={3}
                aria-hidden
            />
        </span>
    );
}
