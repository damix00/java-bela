"use client";

import PlayingCard from "@/components/pages/game/blocks/cards/PlayingCard";
import { cardKey, isTrump, legalMoveKeys, sortHand } from "@/lib/game-rules";
import { cn } from "@/lib/cn";
import type { Card, PlayedCard, Suite } from "@bela/protocol";

import styles from "./HandFan.module.css";

type HandFanProps = {
    hand: Card[];
    trumpSuite: Suite | null;
    /** The trick in progress — what makes a card legal or not. */
    trickCards: PlayedCard[];
    /** Nothing is playable when it is not your turn. */
    active: boolean;
    onPlay: (card: Card) => void;
    hiddenLabel: string;
    /** Withheld seventh/eighth cards before trump is called. */
    hiddenCount?: number;
};

/**
 * Your eight cards, in a thumb-readable hand.
 *
 * Portrait phones get two rows of four, matching the way a physical hand is
 * usually scanned without shrinking the art. Short landscape phones and wider
 * screens keep one overlapped row, where the horizontal room is useful and the
 * vertical room is scarce. The one under the pointer lifts clear of its peers.
 *
 * Legality is decided here so the answer is visible before the press. The
 * backend's `TrickValidator` is still the authority and will refuse anything
 * this gets wrong.
 */
export default function HandFan({
    hand,
    trumpSuite,
    trickCards,
    active,
    onPlay,
    hiddenLabel,
    hiddenCount = 0,
}: HandFanProps) {
    const sorted = sortHand(hand, trumpSuite);
    const legal = active ? legalMoveKeys(trickCards, trumpSuite, hand) : null;
    const cardClass = cn(
        styles.card,
        "w-full sm:w-20 [@media(max-height:560px)]:w-14",
    );

    return (
        <div
            data-game-hand=""
            data-active={active ? "true" : "false"}
            className={styles.hand}
            role="group"
        >
            {sorted.map((card) => {
                // The last two of the deal stay face down until trump is called.
                if (card.hidden) {
                    return (
                        <PlayingCard
                            key={cardKey(card)}
                            faceDown
                            label={hiddenLabel}
                            className={cardClass}
                        />
                    );
                }

                const playable = legal !== null && legal.has(cardKey(card));

                return (
                    <PlayingCard
                        key={cardKey(card)}
                        card={card}
                        trump={isTrump(card, trumpSuite)}
                        disabled={!playable}
                        dimmed={legal !== null && !playable}
                        onClick={playable ? () => onPlay(card) : undefined}
                        className={cn(
                            cardClass,
                            // A liftable card needs to sit above the one after
                            // it, or the lift disappears under its neighbour.
                            playable && "hover:z-10 focus-visible:z-20",
                        )}
                    />
                );
            })}

            {Array.from({ length: hiddenCount }, (_, index) => (
                <PlayingCard
                    key={`undealt-${index}`}
                    faceDown
                    label={hiddenLabel}
                    className={cardClass}
                />
            ))}
        </div>
    );
}
