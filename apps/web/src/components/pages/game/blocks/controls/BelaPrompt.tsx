"use client";

import { Button } from "@/components/controls/Button";
import PlayingCard from "@/components/pages/game/blocks/cards/PlayingCard";
import Card from "@/components/ui/surfaces/Card";
import Modal from "@/components/ui/surfaces/Modal";
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
 * Bela is worth 20 and only scores if you say so as you play the second of the
 * trump King and Queen — so it has to be asked before the card leaves the hand,
 * not after.
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
    return (
        <Modal
            surface="felt"
            dismissible={false}
            closeLabel={skipLabel}
            onClose={() => onAnswer(false)}
            className="max-w-[400px]"
        >
            <Card
                surface="felt"
                padding="none"
                className="items-center gap-4 p-5 sm:p-6"
            >
                <PlayingCard card={card} />

                <p className="text-center font-display text-[17px] font-extrabold tracking-[-.02em] text-cream">
                    {heading}
                </p>

                <p className="text-center text-[13px] font-medium text-mint/80">
                    {body}
                </p>

                <div className="flex w-full flex-wrap justify-center gap-2">
                    <Button
                        surface="felt"
                        size="sm"
                        className="min-h-11"
                        onClick={() => onAnswer(true)}
                    >
                        {declareLabel}
                    </Button>
                    <Button
                        surface="felt"
                        tone="cream"
                        size="sm"
                        className="min-h-11"
                        onClick={() => onAnswer(false)}
                    >
                        {skipLabel}
                    </Button>
                </div>
            </Card>
        </Modal>
    );
}
