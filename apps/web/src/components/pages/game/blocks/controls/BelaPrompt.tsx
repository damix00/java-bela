"use client";

import { Button } from "@/components/controls/Button";
import PlayingCard from "@/components/pages/game/blocks/cards/PlayingCard";
import Card from "@/components/ui/surfaces/Card";
import Modal from "@/components/ui/surfaces/Modal";
import { belaPair, cardKey } from "@/lib/game/rules";
import type { Card as CardType } from "@bela/protocol";

type BelaPromptProps = {
    card: CardType;
    heading: string;
    body: string;
    declareLabel: string;
    skipLabel: string;
    onAnswer: (declare: boolean) => void;
};

/**
 * Bela is worth 20 and can be called as either trump King/Queen is played, so
 * it has to be asked before the card leaves the hand, not after.
 *
 * Both answers play the card. There is no cancel: the press that opened this
 * was already the decision to play it, and a third option would turn one
 * decision into two — which is what `dismissible={false}` says to the shell.
 * The gate is also a straight upgrade on the scrim this used to draw for
 * itself, which had no focus trap and no `Esc` handling whatsoever.
 */
export default function BelaPrompt({
    card,
    heading,
    body,
    declareLabel,
    skipLabel,
    onAnswer,
}: BelaPromptProps) {
    const pair = belaPair(card);

    return (
        <Modal
            surface="felt"
            dismissible={false}
            closeLabel={skipLabel}
            onClose={() => onAnswer(false)}
            className="max-w-[430px]"
        >
            <Card
                surface="felt"
                padding="none"
                className="items-center gap-4 px-5 py-6 sm:px-7 sm:py-7"
            >
                {/* Just the pair and the price. There was a plate under
                    these with a rust glow on it and a clipped overflow, which
                    cost the cards their corners and the badge its bottom half
                    to say nothing the two cards do not already say. */}
                <div className="flex items-end justify-center gap-3" aria-hidden>
                    {pair.map((member) => (
                        <PlayingCard
                            key={cardKey(member)}
                            card={member}
                            className="w-[4.75rem]"
                        />
                    ))}
                </div>

                <span
                    className="rounded-full bg-rust px-3.5 py-1 font-display text-[14px] font-extrabold text-cream"
                    aria-hidden
                >
                    +20
                </span>

                <div className="space-y-1.5">
                    <h2 className="text-center font-display text-[20px] font-extrabold tracking-[-.02em] text-cream">
                        {heading}
                    </h2>
                    <p className="mx-auto max-w-[330px] text-center text-[13px] leading-relaxed font-medium text-mint/80">
                        {body}
                    </p>
                </div>

                {/* Rust against the panel's own colour, not against cream. A
                    cream block is the light one on a dark table and reads as
                    the loud half of the pair, which is backwards here — calling
                    it is the offer, playing quietly is the way past. */}
                <div className="grid w-full grid-cols-2 gap-2">
                    <Button
                        surface="felt"
                        size="sm"
                        className="min-h-12 px-3"
                        onClick={() => onAnswer(true)}
                    >
                        {declareLabel}
                    </Button>
                    <Button
                        surface="felt"
                        tone="mint"
                        size="sm"
                        className="min-h-12 px-3"
                        onClick={() => onAnswer(false)}
                    >
                        {skipLabel}
                    </Button>
                </div>
            </Card>
        </Modal>
    );
}
