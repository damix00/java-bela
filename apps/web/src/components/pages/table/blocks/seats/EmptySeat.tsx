import { ArrowLeftRight, UserRound } from "lucide-react";

import MockLabel from "@/components/pages/table/blocks/shared/MockLabel";
import { cn } from "@/lib/ui/cn";
import { focusRing, pressSm, swapRing } from "@/lib/ui/styles";

type EmptySeatProps = {
    label: string;
    /** Makes the chair a control that moves the reader into it. */
    onClick?: () => void;
    /** What pressing this seat does, for anyone who cannot see the table. */
    actionLabel?: string;
    /** A move into this seat is in flight or has just landed. */
    swapStatus?: "pending" | "complete";
    disabled?: boolean;
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
 * is where the players who fill them will sit. The chair is drawn at whatever
 * size its slot is — filling the side column outright — and below `md` the
 * label goes to assistive tech alone rather than wrapping into four lines of
 * stacked letters.
 *
 * Pressing one moves the reader into it. That used to be refused, because the
 * chair's old "Invite / fill" label promised an invitation the click could not
 * send — but inviting now belongs to the band's own button, which leaves the
 * chair with one meaning and the label free to name it. The glyph changes with
 * the role: a person outline for a seat that is only reporting a vacancy, a
 * pair of arrows for one you can move into.
 */
export default function EmptySeat({
    label,
    onClick,
    actionLabel,
    swapStatus,
    disabled = false,
    className,
}: EmptySeatProps) {
    const shell = cn(
        "flex flex-col items-center justify-center gap-3 p-2",
        "border-4 border-dashed md:gap-4 md:p-4",
        onClick && !disabled
            ? [
                  // A live chair is drawn warmer than an inert one — with no
                  // label to read on a phone, the dash weight is the only thing
                  // there is room to say it with.
                  "cursor-pointer border-mint/60 hover:border-mint hover:bg-mint/5",
                  pressSm,
                  focusRing,
              ]
            : "border-mint/35",
        swapRing(swapStatus),
        className,
    );

    const body = (
        <>
            <Icon interactive={Boolean(onClick)} />
            <MockLabel className="sr-only text-center text-[12px] tracking-normal text-mint/70 normal-case md:not-sr-only">
                {label}
            </MockLabel>
        </>
    );

    if (!onClick) {
        return (
            <div className={shell} aria-label={label}>
                {body}
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={actionLabel ?? label}
            aria-busy={swapStatus === "pending"}
            className={shell}
        >
            {body}
        </button>
    );
}

function Icon({ interactive }: { interactive: boolean }) {
    const Glyph = interactive ? ArrowLeftRight : UserRound;

    return (
        <Glyph
            aria-hidden
            className="size-5 shrink-0 text-mint/65 md:size-6"
            strokeWidth={2.5}
        />
    );
}
