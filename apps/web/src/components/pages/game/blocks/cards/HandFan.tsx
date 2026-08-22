"use client";

import PlayingCard from "@/components/pages/game/blocks/cards/PlayingCard";
import { cardKey, isTrump, legalMoveKeys, sortHand } from "@/lib/game-rules";
import { cn } from "@/lib/cn";
import type { Card, PlayedCard, Suite } from "@bela/protocol";

type HandFanProps = {
    hand: Card[];
    trumpSuite: Suite | null;
    /** The trick in progress — what makes a card legal or not. */
    trickCards: PlayedCard[];
    /** Nothing is playable when it is not your turn. */
    active: boolean;
    onPlay: (card: Card) => void;
    hiddenLabel: string;
};

/**
 * Your eight cards, in a row.
 *
 * Not a fan, despite the name it inherited from the lobby's ornament — an
 * overlapped arc is a lot of geometry for something that has to stay tappable at
 * 360px, and a plain wrapping row does the job. The cards overlap only far
 * enough to fit, and the one under the pointer lifts clear of its neighbours.
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
}: HandFanProps) {
    const sorted = sortHand(hand, trumpSuite);
    const legal = active ? legalMoveKeys(trickCards, trumpSuite, hand) : null;

    return (
        <div
            className="flex flex-wrap items-end justify-center gap-x-0 gap-y-2 px-2"
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
                            className="-ml-3 first:ml-0 sm:-ml-2"
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
                        onClick={playable ? () => onPlay(card) : undefined}
                        className={cn(
                            "-ml-3 first:ml-0 sm:-ml-2",
                            // A liftable card needs to sit above the one after
                            // it, or the lift disappears under its neighbour.
                            playable && "hover:z-10",
                        )}
                    />
                );
            })}
        </div>
    );
}
