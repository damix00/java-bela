"use client";

import { Button } from "@/components/controls/Button";
import PlayingCard from "@/components/pages/game/blocks/cards/PlayingCard";
import Card from "@/components/ui/surfaces/Card";
import Modal from "@/components/ui/surfaces/Modal";
import { Rank, type Card as CardType } from "@bela/protocol";

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
    const partner = {
        suite: card.suite,
        rank: card.rank === Rank.KING ? Rank.QUEEN : Rank.KING,
    };

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
                className="relative items-center gap-4 overflow-hidden px-5 py-6 sm:px-7 sm:py-7"
            >
                <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgb(207_102_68_/_0.24),transparent_70%)]"
                    aria-hidden
                />

                <div className="relative flex h-28 w-36 items-center justify-center" aria-hidden>
                    <PlayingCard
                        card={partner}
                        className="absolute left-5 w-[4.35rem] -rotate-7"
                    />
                    <PlayingCard
                        card={card}
                        className="absolute right-5 w-[4.35rem] rotate-7"
                    />
                    <span className="absolute -bottom-1 z-10 rounded-full bg-rust px-3 py-1 font-display text-[14px] font-extrabold text-cream shadow-[0_2px_8px_rgb(0_0_0_/_0.35)]">
                        +20
                    </span>
                </div>

                <div className="space-y-1.5">
                    <h2 className="text-center font-display text-[20px] font-extrabold tracking-[-.02em] text-cream">
                        {heading}
                    </h2>
                    <p className="mx-auto max-w-[330px] text-center text-[13px] leading-relaxed font-medium text-mint/80">
                        {body}
                    </p>
                </div>

                <div className="grid w-full grid-cols-2 gap-2 pt-1">
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
                        tone="cream"
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
