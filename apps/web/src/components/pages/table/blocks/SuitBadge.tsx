import { cn } from "@/lib/cn";
import type { BadgeTone } from "@/components/pages/table/mock-data";

const tones: Record<BadgeTone, string> = {
    rust: "bg-rust text-cream",
    forest: "bg-forest text-cream",
    ink: "bg-ink text-cream",
    /** Nobody is home — a player already in a match. */
    muted: "bg-canvas text-stone",
};

type SuitBadgeProps = {
    suit: string;
    tone?: BadgeTone;
    size?: "sm" | "md";
    className?: string;
};

/**
 * A player's tile: a suit glyph in a boxed fill, standing in for the avatar the
 * account screens will eventually supply. Decorative — the name is next to it
 * and carries the meaning, so the glyph is hidden from assistive tech.
 */
export default function SuitBadge({
    suit,
    tone = "forest",
    size = "md",
    className,
}: SuitBadgeProps) {
    return (
        <span
            aria-hidden
            className={cn(
                "grid shrink-0 place-items-center border-[3px] border-ink leading-none",
                size === "md" ? "size-11 text-[19px]" : "size-9 text-[16px]",
                tones[tone],
                className,
            )}
        >
            {suit}
        </span>
    );
}
