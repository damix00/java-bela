import MockLabel from "@/components/pages/table/blocks/MockLabel";
import SuitBadge, {
    type BadgeTone,
} from "@/components/pages/table/blocks/SuitBadge";
import { cn } from "@/lib/cn";
import { focusRing, pressSm } from "@/lib/styles";

type SideSeatProps = {
    name: string;
    suit: string;
    tone?: BadgeTone;
    /** Marked as ready — a filled corner rather than a word, at this size. */
    ready?: boolean;
    /** Short mark under the name where there is room for one: host, bot, you. */
    note?: string;
    onClick?: () => void;
    actionLabel?: string;
    className?: string;
};

/**
 * An opponent, in the square the table's side columns give them.
 *
 * The near and across seats are full-width rows and get the whole `SeatCard`;
 * these two get 60px on a phone, which is a tile and a half. So the same person
 * is drawn as the tile alone, gaining their name at `sm` and their role at `lg`
 * — the seat never disappears, it just says less. Dropping the side seats on a
 * narrow screen instead would take the shape of the table with them, and the
 * shape is what tells you what you are joining.
 *
 * The name is always in the accessible name, whatever the width is showing.
 */
export default function SideSeat({
    name,
    suit,
    tone,
    ready = false,
    note,
    onClick,
    actionLabel,
    className,
}: SideSeatProps) {
    const shell = cn(
        "flex flex-col items-center justify-center gap-2 border-4 border-ink bg-cream p-2 shadow-hard md:p-3",
        ready && "bg-forest",
        onClick && ["cursor-pointer", pressSm, focusRing],
        className,
    );

    const body = (
        <>
            <SuitBadge suit={suit} tone={tone} size="sm" />
            <span
                className={cn(
                    "hidden w-full truncate text-center font-display text-[13px] font-extrabold tracking-[-.02em] sm:block",
                    ready ? "text-cream" : "text-ink",
                )}
            >
                {name}
            </span>
            {note && (
                <MockLabel
                    className={cn(
                        "hidden text-center text-[9px] tracking-[.1em] lg:block",
                        ready ? "text-cream/80" : "text-stone",
                    )}
                >
                    {note}
                </MockLabel>
            )}
        </>
    );

    if (!onClick) {
        return (
            <div className={shell} aria-label={name} role="group">
                {body}
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={actionLabel ?? name}
            className={shell}
        >
            {body}
        </button>
    );
}
