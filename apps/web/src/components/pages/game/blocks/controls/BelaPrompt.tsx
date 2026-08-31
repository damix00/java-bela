"use client";

import { Button } from "@/components/controls/Button";
import PlayingCard from "@/components/pages/game/blocks/cards/PlayingCard";
import type { Card } from "@bela/protocol";

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
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={heading}
            className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-6"
        >
            <div className="flex w-full max-w-[400px] flex-col items-center gap-4 rounded-2xl bg-baize-deep p-6 shadow-[0_12px_36px_-10px_rgb(0_0_0_/_0.6)]">
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
            </div>
        </div>
    );
}
