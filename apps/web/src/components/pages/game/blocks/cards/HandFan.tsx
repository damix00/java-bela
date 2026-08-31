"use client";

import PlayingCard from "@/components/pages/game/blocks/cards/PlayingCard";
import { cardKey, legalMoveKeys, sortHand } from "@/lib/game/rules";
import { cn } from "@/lib/ui/cn";
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
    "grid w-[calc(100%-0.5rem)] max-w-[26rem] grid-cols-4 items-end justify-center gap-2 px-0.5 pt-1",
    "portrait-md:max-w-[22rem]",
    "portrait-sm:max-w-[19rem] portrait-sm:gap-1.5",
    "portrait-xs:max-w-[16.5rem]",
    // One row, and the cards stand apart in it. They used to tuck under each
    // other the way a held hand does, which bought width but left every card
    // but the last one half-read; eight separate faces are the thing to look
    // at here, so the row buys its width back from the cards' own size instead.
    "flat:flex flat:w-full flat:max-w-none flat:flex-nowrap flat:gap-1 flat:px-2",
    "desk:flex desk:w-full desk:max-w-none desk:flex-nowrap desk:gap-1.5 desk:px-2",
].join(" ");

/**
 * Your eight cards, in a thumb-readable hand.
 *
 * Portrait phones get two rows of four, matching the way a physical hand is
 * usually scanned without shrinking the art. Short landscape phones and wider
 * screens keep one row, where the horizontal room is useful and the vertical
 * room is scarce. The one under the pointer lifts clear of its peers.
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
    // In one row the card is sized from the viewport rather than pinned: eight
    // cards, seven gaps and no overlap have to fit whatever width there is, and
    // a fixed 80px hand overflows a 640px window the moment it stops tucking.
    const cardClass = cn(
        "w-full",
        "desk:w-[clamp(3.25rem,10.5vw,7rem)]",
        "flat:w-[clamp(2.5rem,8vw,4.25rem)]",
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
                        disabled={!playable}
                        dimmed={legal !== null && !playable}
                        onClick={playable ? () => onPlay(card) : undefined}
                        onDragPlay={playable ? () => onPlay(card) : undefined}
                        className={cn(
                            cardClass,
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
