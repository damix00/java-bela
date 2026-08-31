import MockLabel from "@/components/pages/table/blocks/shared/MockLabel";
import SwapBadge from "@/components/pages/table/blocks/seats/SwapBadge";
import UserAvatar from "@/components/layout/UserAvatar";
import Card from "@/components/ui/surfaces/Card";
import { cn } from "@/lib/ui/cn";
import { dip, swapRing } from "@/lib/ui/styles";

/** A short mark on a seat — "You", "Host", "Ready". */
export type SeatTag = {
    label: string;
    /** Ready is the one state worth colouring; everything else is paper. */
    tone?: "paper" | "ready";
};

type SeatCardProps = {
    name: string;
    /** Null for guests and accounts with no image — the tile falls back to an initial. */
    avatarUrl: string | null;
    /** Everything under the name — partnership, rating, whose deal it is. */
    meta: string;
    /** Marks on the seat, right-aligned in the order given. */
    tags?: SeatTag[];
    /**
     * Makes the whole seat a button. The seats are swap targets in a lobby, and
     * the card *is* the target — a small handle somewhere on it would be a
     * smaller thing to hit for no gain.
     */
    onClick?: () => void;
    /** What pressing this seat does, for anyone who cannot see the table. */
    actionLabel?: string;
    /** A team switch involving this seat is in flight or has just landed. */
    status?: "pending" | "complete";
    disabled?: boolean;
    className?: string;
};

const tagTones: Record<NonNullable<SeatTag["tone"]>, string> = {
    paper: "bg-mint/10 text-mint",
    ready: "bg-forest text-cream",
};

/** A taken seat: who is in it, and what the table knows about them. */
export default function SeatCard({
    avatarUrl,
    name,
    meta,
    tags,
    onClick,
    actionLabel,
    status,
    disabled = false,
    className,
}: SeatCardProps) {
    const body = (
        <>
            <UserAvatar
                username={name}
                avatarUrl={avatarUrl}
                size="lg"
                className="border-mint/30"
            />
            <span className="mr-auto flex min-w-0 flex-col text-left">
                <span className="truncate font-display text-[17px] font-extrabold tracking-[-.02em] text-cream">
                    {name}
                </span>
                {meta && (
                    <span className="truncate font-sans text-[12px] font-medium text-mint/70">
                        {meta}
                    </span>
                )}
            </span>
            {tags?.map((tag) => (
                <MockLabel
                    key={tag.label}
                    className={cn(
                        "rounded-full px-2 py-[6px] sm:px-3",
                        tagTones[tag.tone ?? "paper"],
                    )}
                >
                    {tag.label}
                </MockLabel>
            ))}
            {onClick && <SwapBadge />}
        </>
    );

    const shell = cn(
        "flex-row items-center gap-3 px-3 py-3 portrait-sm:py-2 desk:gap-4 desk:px-4 desk:py-[14px]",
        swapRing(status),
        className,
    );

    if (!onClick) {
        return (
            <Card surface="felt" padding="none" className={shell}>
                {body}
            </Card>
        );
    }

    return (
        <Card
            surface="felt"
            as="button"
            type="button"
            padding="none"
            onClick={onClick}
            disabled={disabled}
            aria-label={actionLabel}
            aria-busy={status === "pending"}
            className={cn(shell, "cursor-pointer text-left", dip)}
        >
            {body}
        </Card>
    );
}
