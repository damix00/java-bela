import PlayingCard from "@/components/pages/game/blocks/cards/PlayingCard";
import { cardKey } from "@/lib/game/rules";
import { cn } from "@/lib/ui/cn";
import type { PlayedCard } from "@bela/protocol";
import type { SeatOrder } from "@/lib/game/seats";

/* The four cards used to lap over each other the way they would on a real
   table, on tracks deliberately narrower than the cards standing in them. They
   no longer do: a card with somebody else's corner across it is a card you have
   to work out rather than read. The tracks are now the full size of what they
   hold — 1.612 is the deck's own 363:585 — and the pile buys that back out of
   the card width instead. */
const pileClass = [
    "grid place-items-center gap-1",
    "[--trick-card:min(7.5rem,31cqw,19.5cqh)]",
    "grid-cols-[repeat(3,var(--trick-card))]",
    "grid-rows-[repeat(3,calc(var(--trick-card)*1.612))]",
].join(" ");

type TrickPileProps = {
    playedCards: PlayedCard[];
    /** Near, left, across, right — where each seat's card belongs on the felt. */
    order: SeatOrder;
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
            <p className="py-6 text-center text-[13px] font-semibold text-mint/60 felt-short:py-2 felt-short:text-[12px] felt-short:leading-tight">
                {emptyLabel}
            </p>
        );
    }

    // The tracks are sized rather than left to their contents: an empty seat's
    // cell would otherwise collapse and slide the whole trick off the middle of
    // the table as each card arrived.
    //
    // `--trick-card` is the card width, and it is measured against the middle of
    // the table (a size container) rather than off a rem ladder — a fixed width
    // big enough to read on a phone is taller than the room a short screen has
    // for three rows of it.
    return (
        <div className={pileClass}>
            {playedCards.map((played) => (
                <div
                    key={`${played.playerIndex}-${cardKey(played.card)}`}
                    className={cn(
                        "relative",
                        placement[played.playerIndex] ??
                            "col-start-2 row-start-2",
                    )}
                >
                    <PlayingCard card={played.card} size="sm" />
                </div>
            ))}
        </div>
    );
}
