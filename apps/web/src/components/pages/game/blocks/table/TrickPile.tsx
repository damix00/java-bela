import PlayingCard from "@/components/pages/game/blocks/cards/PlayingCard";
import { cardKey } from "@/lib/game-rules";
import { cn } from "@/lib/cn";
import type { PlayedCard } from "@bela/protocol";
import type { SeatOrder } from "@/lib/game-seats";

const pileClass = [
    "grid place-items-center",
    "[--trick-card:min(5.25rem,42cqw,28cqh)]",
    "grid-cols-[repeat(3,calc(var(--trick-card)*0.65))]",
    "grid-rows-[repeat(3,calc(var(--trick-card)*0.9))]",
].join(" ");

type TrickPileProps = {
    playedCards: PlayedCard[];
    /** Near, left, across, right — where each seat's card belongs on the felt. */
    order: SeatOrder;
    /** Ringed once the trick is decided. */
    winningPlayerIndex: number | null;
    emptyLabel: string;
};

/**
 * The cards on the felt, each sitting on the edge nearest whoever played it.
 *
 * Position is the only thing that says who played what — there are no labels out
 * here, and a pile that ignored seats would make the trick unreadable the moment
 * more than one person had followed suit.
 */
export default function TrickPile({
    playedCards,
    order,
    winningPlayerIndex,
    emptyLabel,
}: TrickPileProps) {
    const [near, left, across, right] = order;

    // A three-row grid with the middle row split, so the four cards land on the
    // four edges the way they were played from.
    const placement: Record<number, string> = {
        [near]: "col-start-2 row-start-3",
        [left]: "col-start-1 row-start-2",
        [across]: "col-start-2 row-start-1",
        [right]: "col-start-3 row-start-2",
    };

    if (playedCards.length === 0) {
        return (
            <p className="py-6 text-center text-[13px] font-semibold text-mint/60">
                {emptyLabel}
            </p>
        );
    }

    // The tracks are sized rather than left to their contents: an empty seat's
    // cell would otherwise collapse and slide the whole trick off the middle of
    // the felt as each card arrived.
    //
    // `--trick-card` is the card width, and it is measured against the felt (a
    // size container) rather than off a rem ladder — a fixed width big enough to
    // read on a phone is wider than the felt square on a short one, and spills
    // over the border. The tracks are then deliberately smaller than the card
    // they hold, so the four cards lap over each other the way they would on a
    // real table; that buys every card about a third more width for the same
    // patch of felt.
    return (
        <div className={pileClass}>
            {playedCards.map((played) => (
                <div
                    key={`${played.playerIndex}-${cardKey(played.card)}`}
                    className={cn(
                        // Overlapping cards need a stacking order, and the
                        // trick's winner is the one that must not end up under
                        // somebody else's corner.
                        "relative",
                        placement[played.playerIndex] ??
                            "col-start-2 row-start-2",
                        winningPlayerIndex === played.playerIndex &&
                            "z-10 outline-4 outline-offset-2 outline-mint",
                    )}
                >
                    <PlayingCard card={played.card} size="sm" />
                </div>
            ))}
        </div>
    );
}
