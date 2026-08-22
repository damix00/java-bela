import PlayingCard from "@/components/pages/game/blocks/cards/PlayingCard";
import { cardKey } from "@/lib/game-rules";
import { cn } from "@/lib/cn";
import type { PlayedCard } from "@bela/protocol";
import type { SeatOrder } from "@/lib/game-seats";

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

    return (
        <div className="grid grid-cols-3 grid-rows-3 place-items-center gap-1">
            {playedCards.map((played) => (
                <div
                    key={`${played.playerIndex}-${cardKey(played.card)}`}
                    className={cn(
                        placement[played.playerIndex] ??
                            "col-start-2 row-start-2",
                        winningPlayerIndex === played.playerIndex &&
                            "outline-4 outline-offset-2 outline-mint",
                    )}
                >
                    <PlayingCard card={played.card} size="sm" />
                </div>
            ))}
        </div>
    );
}
