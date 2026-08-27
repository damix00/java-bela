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
    /** Withheld seventh/eighth cards before trump is called. */
    hiddenCount?: number;
};

/**
 * Two rows of four is the portrait design, but it is also the biggest single
 * claim on the height, and on a shorter phone that claim is what squeezes the
 * table down to nothing. The cards are sized from this width, so stepping it
 * down hands the room back to the felt.
 *
 * A short landscape phone and a roomy screen both drop to a single overlapped
 * row: laid flat, two rows would spend almost half the available height before
 * the table appeared.
 */
const handClass = [
    "grid w-[calc(100%-1rem)] max-w-84 grid-cols-4 items-end justify-center gap-2 px-0.5 pt-1",
    "portrait-md:max-w-[18.5rem]",
    "portrait-sm:max-w-64 portrait-sm:gap-1.5",
    "portrait-xs:max-w-56",
    "flat:flex flat:w-full flat:max-w-[25.5rem] flat:flex-nowrap flat:gap-0 flat:px-2",
    "desk:flex desk:w-full desk:max-w-[25.5rem] desk:flex-nowrap desk:gap-0 desk:px-2",
].join(" ");

/** How far each card tucks under the one before it, once the hand is one row. */
const overlapClass =
    "flat:not-first:-ml-5 desk:not-first:-ml-3.5";

/**
 * Your eight cards, in a thumb-readable hand.
 *
 * Portrait phones get two rows of four, matching the way a physical hand is
 * usually scanned without shrinking the art. Short landscape phones and wider
 * screens keep one overlapped row, where the horizontal room is useful and the
 * vertical room is scarce. The one under the pointer lifts clear of its peers.
 *
 * A playable card is thrown either by a tap or by dragging it up off the hand
 * — the tap is the quick one, the drag is the one that reads as playing a card
 * and is the easier target under a thumb. Both end in the same `onPlay`.
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
        overlapClass,
        "w-full sm:w-20 [@media(max-height:560px)]:w-14",
    );

    return (
        <div
            data-game-hand=""
            data-active={active ? "true" : "false"}
            className={handClass}
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
                        onDragPlay={playable ? () => onPlay(card) : undefined}
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
