"use client";

import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/controls/Button";
import PlayingCard from "@/components/pages/game/blocks/cards/PlayingCard";
import type { Card } from "@bela/protocol";
import { cn } from "@/lib/ui/cn";
import { panelRaised, scrim } from "@/lib/ui/styles";

type BelaPromptProps = {
    card: Card;
    heading: string;
    body: string;
    declareLabel: string;
    skipLabel: string;
    onAnswer: (declare: boolean) => void;
};

/**
 * Bela is worth 20 and only scores if you say so as you play the second of the
 * trump King and Queen — so it has to be asked before the card leaves the hand,
 * not after.
 *
 * Both answers play the card. There is no cancel: the press that opened this
 * was already the decision to play it, and a third option would turn one
 * decision into two.
 */
export default function BelaPrompt({
    card,
    heading,
    body,
    declareLabel,
    skipLabel,
    onAnswer,
}: BelaPromptProps) {
    const reduceMotion = useReducedMotion();
    const transition = reduceMotion
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 320, damping: 32, mass: 0.8 };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={heading}
            className={cn(scrim, "p-6")}
        >
            <motion.div
                initial={
                    reduceMotion ? false : { opacity: 0, scale: 0.97, y: 12 }
                }
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={transition}
                className={cn(
                    panelRaised,
                    "flex w-full max-w-[400px] flex-col items-center gap-4 p-6",
                )}
            >
                <PlayingCard card={card} />

                <p className="text-center font-display text-[20px] font-extrabold tracking-[-.02em] text-cream">
                    {heading}
                </p>

                <p className="text-center text-[14px] font-medium text-mint/80">
                    {body}
                </p>

                <div className="flex w-full flex-wrap justify-center gap-2">
                    <Button size="sm" soft onClick={() => onAnswer(true)}>
                        {declareLabel}
                    </Button>
                    <Button
                        tone="cream"
                        size="sm"
                        soft
                        onClick={() => onAnswer(false)}
                    >
                        {skipLabel}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
