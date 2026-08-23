import Image from "next/image";

import {
    HUNGARIAN_CARD_BACK_ASSET,
    getHungarianCardAsset,
} from "@/lib/card-assets";
import { cn } from "@/lib/cn";
import { focusRing } from "@/lib/styles";
import type { Card, Rank, Suite } from "@bela/protocol";

/**
 * One card, face up or face down.
 *
 * The art is the Hungarian deck already in `public/cards/hungarian` — the same
 * pack the game is played with in this part of the world, where the suits are
 * hearts, bells, acorns and leaves rather than the French four. `back.svg` is
 * drawn at 363×585, so every card here holds that aspect and only its width is
 * ever set.
 *
 * A card that cannot legally be played is dimmed rather than hidden: knowing
 * which of your cards are dead is half of reading a trick, and removing them
 * would make the hand jump every time somebody else played.
 */

const WIDTHS = {
    /** On the felt, and in the three hands that are not yours. */
    sm: "w-10 sm:w-14 [@media(max-height:560px)]:w-9",
    /** Your own hand. */
    md: "w-[clamp(3.625rem,17vw,4.25rem)] sm:w-20 [@media(max-height:560px)]:w-14",
} as const;

type PlayingCardProps = {
    card?: Pick<Card, "suite" | "rank"> | null;
    size?: keyof typeof WIDTHS;
    /** Draw the back regardless — an opponent's hand, or a card still hidden. */
    faceDown?: boolean;
    /** Marks the trump suit in your hand. */
    trump?: boolean;
    /** Dimmed and inert: legal in the deck, not legal right now. */
    disabled?: boolean;
    /** Visually recede an illegal card without washing out an idle hand. */
    dimmed?: boolean;
    onClick?: () => void;
    label?: string;
    className?: string;
};

export default function PlayingCard({
    card,
    size = "md",
    faceDown = false,
    trump = false,
    disabled = false,
    dimmed = false,
    onClick,
    label,
    className,
}: PlayingCardProps) {
    const hidden = faceDown || !card;
    const asset = hidden
        ? null
        : getHungarianCardAsset(card.suite as Suite, card.rank as Rank);

    const frame = cn(
        // `self-start` is load-bearing, not cosmetic. The art is laid in with
        // `fill`, which needs a parent of non-zero height, and the height here
        // comes from the aspect ratio against the width. Inside a row flex
        // container the default `align-items: stretch` overrides that with the
        // line's own height — which is being decided by these very cards, so it
        // resolves to zero and every card collapses. Opting out of the stretch
        // hands the height back to the aspect ratio. Callers can still override
        // it; `twMerge` keeps the last `self-*` to arrive.
        "relative block aspect-[363/585] shrink-0 self-start overflow-hidden border-[3px] border-ink bg-cream shadow-hard-sm",
        WIDTHS[size],
        trump && "border-rust",
        dimmed && "opacity-45 saturate-50",
        className,
    );

    const art = (
        <Image
            src={asset?.src ?? HUNGARIAN_CARD_BACK_ASSET}
            alt={hidden ? "" : asset!.alt}
            fill
            sizes="(max-height: 560px) 56px, (min-width: 640px) 80px, calc((100vw - 4rem) / 4)"
            className="object-cover"
        />
    );

    if (!onClick) {
        return (
            <span className={frame} aria-label={label} role={label ? "img" : undefined}>
                {art}
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label ?? asset?.alt}
            className={cn(
                frame,
                focusRing,
                // No press physics here. A card is not a block with a shadow to
                // sink onto — it lifts, which is what a hand of cards does.
                "cursor-pointer touch-manipulation transition-transform duration-100 hover:-translate-y-2 active:-translate-y-2 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0",
            )}
        >
            {art}
        </button>
    );
}
