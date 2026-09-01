"use client";

import Image from "next/image";
import { motion, useReducedMotion, type PanInfo } from "motion/react";
import { useRef } from "react";

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

/* Width, and the radius that goes with it. The two are one decision: a felt
   card is barely half the width of one in the hand, and a single radius that
   looks like a card at 80px looks like a lozenge at 44px. */
const SIZES = {
    /** On the felt, where `TrickPile` sizes `--trick-card` against the table. */
    sm: {
        width: "w-[var(--trick-card,3.5rem)]",
        radius: "rounded-[6px]",
    },
    /** A declared set, listed rather than played. */
    xs: {
        width: "w-8 sm:w-10",
        radius: "rounded-[4px]",
    },
    /** Your own hand. */
    md: {
        width: "w-[clamp(3.625rem,17vw,4.25rem)] sm:w-20 [@media(max-height:560px)]:w-14",
        radius: "rounded-[10px]",
    },
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
 * Nothing else plays the card. A short, slow drag springs back; a card held
 * clearly above the hand or flicked upward with intent is played. A tap is
 * already there for the quick way to play.
 */
const DRAG_PLAY_THRESHOLD = 72;

/** A card has to be released with intent, not merely parked above the hand. */
const DRAG_PLAY_VELOCITY = -350;

type PlayingCardProps = {
    card?: Pick<Card, "suite" | "rank"> | null;
    size?: keyof typeof SIZES;
    /** Draw the back regardless — an opponent's hand, or a card still hidden. */
    faceDown?: boolean;
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
    disabled = false,
    dimmed = false,
    onClick,
    onDragPlay,
    label,
    className,
}: PlayingCardProps) {
    const reduced = useReducedMotion();
    // Motion starts a drag after the pointer has moved a few pixels. Keep that
    // fact outside React state — it only decides whether the release's native
    // click is a play, and re-rendering every card at the end of a drag would
    // make the hand feel less direct.
    const dragged = useRef(false);

    const hidden = faceDown || !card;
    const asset = hidden
        ? null
        : getHungarianCardAsset(card.suite as Suite, card.rank as Rank);

    // The width is deliberately *not* in here. A dragged card is two elements
    // — a wrapper the hand lays out, and the button that moves under it — and
    // the button has to be `w-full` of that wrapper. Baking the size into the
    // shared frame left the button merging `w-full` against a responsive width
    // whose variants `twMerge` cannot see as a conflict, so the one playable
    // card in the hand came out a size smaller than its dead neighbours.
    const frameBase = cn(
        // `self-start` is load-bearing, not cosmetic. The art is laid in with
        // `fill`, which needs a parent of non-zero height, and the height here
        // comes from the aspect ratio against the width. Inside a row flex
        // container the default `align-items: stretch` overrides that with the
        // line's own height — which is being decided by these very cards, so it
        // resolves to zero and every card collapses. Opting out of the stretch
        // hands the height back to the aspect ratio. Callers can still override
        // it; `twMerge` keeps the last `self-*` to arrive.
        // No frame drawn around the art: the deck's own white margin is the
        // card face, and the hard ink border that the rest of the site is
        // drawn with read as a sticker rather than as a card. What is left is
        // the radius and a shadow soft enough to say the card is lying on the
        // felt rather than pinned above it.
        "relative block aspect-[363/585] shrink-0 self-start overflow-hidden bg-cream shadow-[0_2px_6px_rgb(0_0_0_/_0.35)]",
        SIZES[size].radius,
        dimmed && "opacity-45 saturate-50",
    );
    const frame = cn(frameBase, SIZES[size].width, className);

    const art = (
        <Image
            src={asset?.src ?? HUNGARIAN_CARD_BACK_ASSET}
            alt={hidden ? "" : asset!.alt}
            fill
            sizes="(max-height: 560px) 68px, (min-width: 640px) 112px, calc((100vw - 3rem) / 4)"
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
        // A card is played after either a clear upward placement or a decisive
        // upward flick. `offset` is the drag's final position relative to the
        // hand, so a player can hold a card over the felt and release it at
        // rest; velocity is only the alternative quick gesture.
        const onDragEnd = (_event: unknown, info: PanInfo) => {
            // A browser click follows the pointer release. Leave this set for
            // that event too, otherwise a cancelled drag can play the card.
            dragged.current = true;
            window.setTimeout(() => {
                dragged.current = false;
            }, 0);

            if (
                info.offset.y <= -DRAG_PLAY_THRESHOLD ||
                info.velocity.y <= DRAG_PLAY_VELOCITY
            ) {
                onDragPlay();
            }
        };

        return (
            // The wrapper is the one the hand lays out: it keeps the caller's
            // width, overlap margin and stacking, and hovers the card upward,
            // while the button below it is free to be moved by the drag.
            <span
                className={cn(
                    "relative block shrink-0 self-start",
                    SIZES[size].width,
                    className,
                    liftClass,
                )}
            >
                <motion.button
                    type="button"
                    onClick={() => {
                        if (!dragged.current) onClick();
                    }}
                    aria-label={label ?? asset?.alt}
                    className={cn(
                        frameBase,
                        focusRing,
                        // The wrapper is what has a size; this fills it.
                        "w-full cursor-grab touch-none select-none [-webkit-touch-callout:none] active:cursor-grabbing",
                    )}
                    drag
                    // Nothing pins the card, so it follows the finger exactly and
                    // is returned by the spring rather than by a constraint.
                    dragSnapToOrigin
                    dragMomentum={false}
                    dragTransition={{ bounceStiffness: 560, bounceDamping: 40 }}
                    onDragStart={() => {
                        dragged.current = true;
                    }}
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
