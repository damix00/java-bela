import MockLabel from "@/components/pages/table/blocks/MockLabel";
import { cn } from "@/lib/cn";

/**
 * A seat with nobody in it.
 *
 * Dashed and unfilled where every other block on the table is a solid slab
 * with a shadow under it — the absence is the point, so the block reads as an
 * outline waiting to be filled rather than a card that happens to be empty.
 *
 * The two open seats sit either side of the felt at every width, because that
 * is where the players who fill them will sit. On a phone the column is only
 * wide enough for the tile, so the label goes to assistive tech alone rather
 * than wrapping into four lines of stacked letters.
 */
export default function EmptySeat({
    label,
    className,
}: {
    label: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-3 p-2",
                "border-4 border-dashed border-mint/35 md:gap-4 md:p-4",
                className,
            )}
        >
            <span
                aria-hidden
                // On a phone the seat is only the dashed square, so the plus is set
                // loose in it — boxing a tile inside a box that small reads as two
                // frames arguing rather than one empty chair.
                className="grid shrink-0 place-items-center border-mint/45 text-[22px] leading-none text-mint/70 md:size-9 md:border-[3px] md:text-[20px]"
            >
                +
            </span>
            <MockLabel className="sr-only text-center text-mint/70 md:not-sr-only">
                {label}
            </MockLabel>
        </div>
    );
}
