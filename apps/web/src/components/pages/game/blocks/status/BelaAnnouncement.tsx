"use client";

import { motion, useReducedMotion } from "motion/react";

import PlayingCard from "@/components/pages/game/blocks/cards/PlayingCard";
import { belaPair, cardKey } from "@/lib/game/rules";
import { panelRaised, popTransition } from "@/lib/ui/styles";
import type { Card } from "@bela/protocol";

type BelaAnnouncementProps = {
    /** The trump king or queen that was played — the pair is derived from it. */
    card: Card;
    message: string;
    pointsLabel: string;
};

/**
 * A public, non-blocking call: everyone at the table sees who announced bela.
 *
 * It shows the pair rather than a sparkle. The whole content of the call is
 * *which* two cards a seat has just proved it holds, and a generic icon said
 * only that something had happened — while the two cards say it, name the
 * trump suit, and match the dialog the caller answered a moment earlier.
 */
export default function BelaAnnouncement({
    card,
    message,
    pointsLabel,
}: BelaAnnouncementProps) {
    const reduceMotion = useReducedMotion();
    const pair = belaPair(card);

    return (
        <motion.div
            role="status"
            aria-live="assertive"
            // The shared pop curve, flipped: this one hangs from the top of the
            // screen, so it arrives from above rather than from below. Same
            // spring as every other block that lands over the felt.
            initial={
                reduceMotion ? false : { opacity: 0, scale: 0.96, y: -12 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
                reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.98, y: -6 }
            }
            transition={reduceMotion ? { duration: 0 } : popTransition}
            className={`${panelRaised} pointer-events-auto flex items-center gap-3 bg-baize-deep py-2.5 pr-4 pl-3 text-cream`}
        >
            {/* The pair, tucked into each other the way a held bela is — small
                enough to read as a mark rather than as cards in play. */}
            <span className="flex shrink-0 items-center" aria-hidden>
                {pair.map((member, index) => (
                    <PlayingCard
                        key={cardKey(member)}
                        card={member}
                        size="xs"
                        className={index === 0 ? "-rotate-6" : "-ml-4 rotate-6"}
                    />
                ))}
            </span>

            <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[15px] font-extrabold">
                    {message}
                </span>
                <span className="block truncate text-[12px] font-semibold text-mint/70">
                    {pointsLabel}
                </span>
            </span>

            <span className="shrink-0 rounded-full bg-rust px-2.5 py-1 font-display text-[13px] font-extrabold text-cream tabular-nums">
                +20
            </span>
        </motion.div>
    );
}
