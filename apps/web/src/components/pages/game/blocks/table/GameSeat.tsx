import PlayingCard from "@/components/pages/game/blocks/cards/PlayingCard";
import { cn } from "@/lib/cn";

type GameSeatProps = {
    name: string;
    /** How many cards they still hold. Drawn as backs, capped so it stays legible. */
    cardCount: number;
    /** Theirs to act — the only state on this screen that has to be unmissable. */
    active: boolean;
    /** They took the trick now sitting on the felt. */
    won: boolean;
    /** Your partner, as the game pairs it. */
    partner: boolean;
    /** Wide plates sit at the near and far edges, squares take the sides. */
    variant: "wide" | "square";
    /** Suffix for the seat that is you. */
    youLabel?: string;
    wonLabel: string;
};

/** How many backs to draw before it stops being worth counting. */
const MAX_BACKS = 8;

/**
 * A player at the table: who they are, how much they are still holding, and
 * whether the table is waiting on them.
 *
 * Deliberately not the lobby's `SeatCard`. That one carries rating bands, swap
 * affordances and an invite path, none of which mean anything once the cards are
 * out, and bending it to two jobs would have grown a branch per screen. This is
 * the same visual language and a tenth of the surface.
 */
export default function GameSeat({
    name,
    cardCount,
    active,
    won,
    partner,
    variant,
    youLabel,
    wonLabel,
}: GameSeatProps) {
    const backs = Math.min(cardCount, MAX_BACKS);

    return (
        <div
            className={cn(
                "flex w-full min-w-0 border-4 border-ink bg-baize-deep p-2 shadow-hard-sm",
                variant === "wide"
                    ? "flex-row items-center gap-3 px-3"
                    : "h-full flex-col items-center justify-center gap-1 text-center",
                // The turn marker has to read at a glance across a felt table,
                // so it is the frame that changes, not a dot beside the name.
                active && "border-rust bg-baize",
            )}
        >
            <div className="flex min-w-0 flex-col">
                <span
                    className={cn(
                        "truncate font-display font-extrabold tracking-[-.02em] text-cream",
                        variant === "wide" ? "text-[16px]" : "text-[13px]",
                    )}
                >
                    {name}
                    {youLabel && (
                        <span className="text-mint/70"> · {youLabel}</span>
                    )}
                </span>

                <span className="text-[12px] font-semibold text-mint/70">
                    {partner ? "◆ " : ""}
                    {cardCount}
                    {won && ` · ${wonLabel}`}
                </span>
            </div>

            {/* An overlapped run of backs, so "how much is left" is readable
                without reading the number. */}
            <div
                className={cn(
                    "flex shrink-0",
                    variant === "wide" ? "ml-auto" : "mt-1",
                )}
                aria-hidden
            >
                {Array.from({ length: backs }, (_, index) => (
                    <PlayingCard
                        key={index}
                        size="sm"
                        faceDown
                        className="-ml-8 w-8 first:ml-0 sm:-ml-9 sm:w-9"
                    />
                ))}
            </div>
        </div>
    );
}
