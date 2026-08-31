import MockLabel from "@/components/pages/table/blocks/shared/MockLabel";
import SwapBadge from "@/components/pages/table/blocks/seats/SwapBadge";
import { cn } from "@/lib/ui/cn";
import { focusRing, pressSm, swapRing } from "@/lib/ui/styles";
import UserAvatar from "@/components/layout/UserAvatar";

type SideSeatProps = {
    name: string;
    /** Null for guests and accounts with no image — the tile falls back to an initial. */
    avatarUrl: string | null;
    /** Marked as ready — a filled corner rather than a word, at this size. */
    ready?: boolean;
    /** Short mark under the name where there is room for one: host, bot, you. */
    note?: string;
    onClick?: () => void;
    actionLabel?: string;
    /** A team switch involving this seat is in flight or has just landed. */
    swapStatus?: "pending" | "complete";
    disabled?: boolean;
    className?: string;
};

/**
 * An opponent, in the square the table's side columns give them.
 *
 * The near and across seats are full-width rows and get the whole `SeatCard`;
 * these two get 88px on a phone, which is a tile with a name under it. That is
 * the floor rather than the ideal: this used to be 48px, which held the tile
 * alone — and not even that, since the avatar is 40px and the borders and
 * padding left 24px for it, so it spilled out of its own box while the name was
 * hidden outright. Two of the four people at the table were an unnamed smear.
 *
 * So the column pays for the name out of the felt, and the role still waits for
 * `desk-lg`, where there is room to say it. Dropping the side seats on a narrow
 * screen instead would take the shape of the table with them, and the shape is
 * what tells you what you are joining.
 *
 * The name is always in the accessible name, whatever the width is showing.
 */
export default function SideSeat({
    name,
    avatarUrl,
    ready = false,
    note,
    onClick,
    actionLabel,
    swapStatus,
    disabled = false,
    className,
}: SideSeatProps) {
    const shell = cn(
        "relative flex min-w-0 flex-col items-center justify-center gap-1.5 border-4 border-ink bg-cream p-1.5 shadow-hard desk:gap-2 desk:p-2 desk-md:p-3",
        ready && "bg-forest",
        onClick && !disabled && ["cursor-pointer", pressSm, focusRing],
        swapRing(swapStatus),
        className,
    );

    const body = (
        <>
            {/* Cornered rather than stacked: the avatar and the name already
                fill the square, and on a phone there is nothing spare. */}
            {onClick && (
                <SwapBadge size="sm" className="absolute top-1 right-1" />
            )}
            <UserAvatar
                username={name}
                avatarUrl={avatarUrl}
                className={ready ? "border-cream" : "border-ink"}
            />
            <span
                className={cn(
                    "w-full truncate text-center font-display text-[11px] font-extrabold tracking-[-.02em] desk:text-[13px]",
                    ready ? "text-cream" : "text-ink",
                )}
            >
                {name}
            </span>
            {note && (
                <MockLabel
                    className={cn(
                        "hidden text-center text-[9px] tracking-[.1em] desk-lg:block",
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
            disabled={disabled}
            aria-label={actionLabel ?? name}
            aria-busy={swapStatus === "pending"}
            className={shell}
        >
            {body}
        </button>
    );
}
