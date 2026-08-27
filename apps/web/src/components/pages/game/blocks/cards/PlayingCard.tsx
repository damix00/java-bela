"use client";

import Image from "next/image";
import { motion, useReducedMotion, type PanInfo } from "motion/react";

import {
    HUNGARIAN_CARD_BACK_ASSET,
    getHungarianCardAsset,
} from "@/lib/game/card-assets";
import { cn } from "@/lib/ui/cn";
import { focusRing } from "@/lib/ui/styles";
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
    /** On the felt, where `TrickPile` sizes `--trick-card` against the table. */
    sm: "w-[var(--trick-card,3.5rem)]",
    /** Your own hand. */
    md: "w-[clamp(3.625rem,17vw,4.25rem)] sm:w-20 [@media(max-height:560px)]:w-14",
} as const;

/* The card lifts on hover rather than sinking: it is not a block with a shadow
   to press onto, it is a card in a hand. Kept as a CSS transform on the outer
   element so a draggable card can own its own transform underneath it — two
   elements compose, one element would have the lift and the drag fighting over
   the same `translate`. */
const liftClass =
    "transition-transform duration-100 hover:-translate-y-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0";

/**
 * How far up the card has to be dragged before letting go throws it.
 *
 * A fixed distance rather than a share of the card or of the screen: the
 * gesture should ask for the same movement everywhere, and 72px is a little
 * under the height of the smallest card the hand ever draws — so at the
 * threshold the card has just about cleared the row it was sitting in.
 *
 * Nothing else plays the card. A short flick, however fast, is cancelled and
 * springs back; a tap is already there for the quick way to play.
 */
const DRAG_PLAY_THRESHOLD = 72;

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
    /**
     * Makes the card draggable: pull it up off the hand and let go past half
     * its own height to throw it. Anything short of that springs back.
     */
    onDragPlay?: () => void;
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
    onDragPlay,
    label,
    className,
}: PlayingCardProps) {
    const reduced = useReducedMotion();

    const hidden = faceDown || !card;
    const asset = hidden
        ? null
        : getHungarianCardAsset(card.suite as Suite, card.rank as Rank);

    const frameBase = cn(
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
    );
    const frame = cn(frameBase, className);

    const art = (
        <Image
            src={asset?.src ?? HUNGARIAN_CARD_BACK_ASSET}
            alt={hidden ? "" : asset!.alt}
            fill
            sizes="(max-height: 560px) 56px, (min-width: 640px) 80px, calc((100vw - 4rem) / 4)"
            // The art never takes the pointer itself: a native image drag on
            // desktop, or iOS's long-press callout, would both cut the card's
            // own gesture short.
            draggable={false}
            className="pointer-events-none object-cover select-none"
        />
    );

    if (!onClick) {
        return (
            <span
                className={frame}
                aria-label={label}
                role={label ? "img" : undefined}
            >
                {art}
            </span>
        );
    }

    if (onDragPlay && !disabled) {
        // Only the distance decides. `offset` is measured from where the drag
        // started, so it is the card's own travel and not the pointer's.
        const onDragEnd = (_event: unknown, info: PanInfo) => {
            if (info.offset.y <= -DRAG_PLAY_THRESHOLD) onDragPlay();
        };

        return (
            // The wrapper is the one the hand lays out: it keeps the caller's
            // width, overlap margin and stacking, and hovers the card upward,
            // while the button below it is free to be moved by the drag.
            <span
                className={cn(
                    "relative block shrink-0 self-start",
                    WIDTHS[size],
                    className,
                    liftClass,
                )}
            >
                <motion.button
                    type="button"
                    onClick={onClick}
                    aria-label={label ?? asset?.alt}
                    className={cn(
                        frameBase,
                        focusRing,
                        // Width comes from the wrapper now; `twMerge` keeps this
                        // last `w-*` over the size's own.
                        "w-full cursor-grab touch-none select-none [-webkit-touch-callout:none] active:cursor-grabbing",
                    )}
                    drag
                    // Nothing pins the card, so it follows the finger exactly and
                    // is returned by the spring rather than by a constraint.
                    dragSnapToOrigin
                    dragMomentum={false}
                    dragTransition={{ bounceStiffness: 560, bounceDamping: 40 }}
                    whileDrag={
                        // The zIndex matters most on a phone, where the top row
                        // of the hand is dragged straight over the bottom one.
                        reduced ? { zIndex: 50 } : { scale: 1.08, zIndex: 50 }
                    }
                    onDragEnd={onDragEnd}
                >
                    {art}
                </motion.button>
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
                liftClass,
                "cursor-pointer touch-manipulation active:-translate-y-2 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:translate-y-0 motion-reduce:active:translate-y-0",
            )}
        >
            {art}
        </button>
    );
}
