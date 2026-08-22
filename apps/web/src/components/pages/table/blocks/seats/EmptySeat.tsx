import { UserRound } from "lucide-react";

import MockLabel from "@/components/pages/table/blocks/shared/MockLabel";
import { cn } from "@/lib/cn";

type EmptySeatProps = {
    label: string;
    className?: string;
};

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
 *
 * This is status rather than a control. The table link is the invitation
 * action, while pressing an empty chair used to move the current player and
 * made the “Invite / fill” label promise something the click could not do.
 */
export default function EmptySeat({ label, className }: EmptySeatProps) {
    const shell = cn(
        "flex flex-col items-center justify-center gap-3 p-2",
        "border-4 border-dashed border-mint/35 md:gap-4 md:p-4",
        className,
    );

    return (
        <div className={shell} aria-label={label}>
            {/* A person outline communicates vacancy without the “add” action
                implied by the old plus sign. */}
            <UserRound
                aria-hidden
                className="size-5 shrink-0 text-mint/65 md:size-6"
                strokeWidth={2.5}
            />
            <MockLabel className="sr-only text-center text-mint/70 md:not-sr-only">
                {label}
            </MockLabel>
        </div>
    );
}
