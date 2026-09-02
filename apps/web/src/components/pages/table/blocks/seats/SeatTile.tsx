import MockLabel from "@/components/pages/table/blocks/shared/MockLabel";
import SwapBadge from "@/components/pages/table/blocks/seats/SwapBadge";
import { cn } from "@/lib/ui/cn";
import { dip, focusRing, panelNested, swapRing } from "@/lib/ui/styles";
import UserAvatar from "@/components/layout/UserAvatar";

type SeatTileProps = {
    name: string;
    /** Null for guests and accounts with no image — the tile falls back to an initial. */
    avatarUrl: string | null;
    /** Marked as ready — a filled tile rather than a word, at this size. */
    ready?: boolean;
    /** Who this is to the reader: you, your partner, the host, an opponent. */
    note?: string;
    onClick?: () => void;
    actionLabel?: string;
    /** A team switch involving this seat is in flight or has just landed. */
    swapStatus?: "pending" | "complete";
    disabled?: boolean;
    className?: string;
};

/**
 * A player, in the square every seat at this table is drawn in.
 *
 * All four are the same tile, and that is the point. The near and across seats
 * used to be wide cards while the side seats were squares — and an empty chair
 * was a square of a third size again — so changing teams moved a player between
 * two different shapes *and* resized the grid row they left behind. The felt
 * and everything under it slid by up to 104px on a press, which made a seat
 * change read as the page rearranging itself rather than as one person standing
 * up and sitting down.
 *
 * Four identical squares cannot do that. Every slot is the same box whether it
 * holds a player or a vacancy, so a swap is a pure change of position: nothing
 * grows, nothing reflows, and Motion's shared layout has only a translation to
 * animate. It is also simply what the table looks like — four seats of equal
 * standing around the felt, none of them the important one.
 *
 * What the wide card had room for and this does not is a row of tags. Ready is
 * the whole tile going forest, and the one remaining mark — you, partner, host,
 * opponent — is the line under the name, which is the only one of them a player
 * ever needed at a glance. The name is always in the accessible name too.
 */
export default function SeatTile({
    name,
    avatarUrl,
    ready = false,
    note,
    onClick,
    actionLabel,
    swapStatus,
    disabled = false,
    className,
}: SeatTileProps) {
    const shell = cn(
        panelNested,
        "relative flex min-w-0 flex-col items-center justify-center gap-1 p-1.5 desk:gap-2 desk:p-2 desk-md:p-3",
        // Ready is the one state worth a colour of its own: forest is the only
        // block on the felt that is neither the table nor a panel on it.
        ready && "bg-forest",
        onClick && !disabled && ["cursor-pointer", dip, focusRing],
        swapRing(swapStatus),
        className,
    );

    const body = (
        <>
            {/* Cornered rather than stacked: the avatar, the name and the role
                already fill the square, and on a phone there is nothing spare. */}
            {onClick && (
                <SwapBadge size="sm" className="absolute top-1 right-1" />
            )}
            <UserAvatar
                username={name}
                avatarUrl={avatarUrl}
                className={ready ? "border-cream" : "border-mint/30"}
            />
            {/* Tight leading throughout: at 88px the square is paid for in
                single pixels, and the two lines have to sit under a 40px avatar
                without pushing out of their own box. */}
            <span className="w-full truncate text-center font-display text-[11px] leading-tight font-extrabold tracking-[-.02em] text-cream desk:text-[13px]">
                {name}
            </span>
            {note && (
                <MockLabel
                    className={cn(
                        "w-full truncate text-center text-[9px] leading-tight tracking-[.1em] desk:text-[10px]",
                        ready ? "text-cream/80" : "text-mint/70",
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
