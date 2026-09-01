import PlayingCard from "@/components/pages/game/blocks/cards/PlayingCard";
import { cardKey } from "@/lib/game/rules";
import { cn } from "@/lib/ui/cn";
import type { PlayedCard } from "@bela/protocol";
import type { SeatOrder } from "@/lib/game/seats";

/* The tracks are slightly narrower than their cards, giving the trick a modest
   physical overlap without covering the rank and suit artwork. `--trick-card`
   remains the real landing size; the step variables only decide how tightly
   the four seat positions gather around the middle. */
const pileClass = [
    "grid place-items-center gap-1",
    "[--trick-card:min(8.5rem,38cqw,23cqh)]",
    "[--trick-step-x:calc(var(--trick-card)*0.78)]",
    "[--trick-step-y:calc(var(--trick-card)*1.612*0.78)]",
    "grid-cols-[repeat(3,var(--trick-step-x))]",
    "grid-rows-[repeat(3,var(--trick-step-y))]",
].join(" ");

type TrickPileProps = {
    playedCards: PlayedCard[];
    /** Near, left, across, right — where each seat's card belongs on the felt. */
    order: SeatOrder;
    emptyLabel: string;
    roundNumber: number;
    trickNumber: number;
    /** Cards represented by the fixed flight layer until they land. */
    flyingCardKeys?: ReadonlySet<string>;
};

export function playedCardKey(played: PlayedCard) {
    return `${played.playerIndex}-${cardKey(played.card)}`;
}

/** A tiny deterministic scatter, so React re-renders never rotate cards again. */
export function playedCardRotation(
    played: PlayedCard,
    localPlayerIndex: number,
    roundNumber: number,
    trickNumber: number,
) {
    if (played.playerIndex === localPlayerIndex) return 0;

    const seed = `${roundNumber}-${trickNumber}-${playedCardKey(played)}`;
    let hash = 0;
    for (const character of seed) {
        hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    }

    return ((hash % 1001) - 500) / 100;
}

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
    roundNumber,
    trickNumber,
    flyingCardKeys,
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

    const byPlayer = new Map(
        playedCards.map((played) => [played.playerIndex, played]),
    );

    // The tracks are sized rather than left to their contents: an empty seat's
    // cell would otherwise collapse and slide the whole trick off the middle of
    // the table as each card arrived.
    //
    // `--trick-card` is the card width, and it is measured against the middle of
    // the table (a size container) rather than off a rem ladder — a fixed width
    // big enough to read on a phone is taller than the room a short screen has
    // for three rows of it.
    return (
        <div className={cn(pileClass, "relative")}>
            {order.map((playerIndex) => {
                const played = byPlayer.get(playerIndex);
                const key = played ? playedCardKey(played) : null;
                const rotation = played
                    ? playedCardRotation(
                          played,
                          near,
                          roundNumber,
                          trickNumber,
                      )
                    : 0;
                const playOrder = played
                    ? playedCards.findIndex(
                          (candidate) =>
                              candidate.playerIndex === played.playerIndex,
                      )
                    : -1;

                return (
                    <div
                        key={playerIndex}
                        data-card-destination={playerIndex}
                        className={cn(
                            "relative w-[var(--trick-card)] place-self-center aspect-[363/585]",
                            placement[playerIndex] ??
                                "col-start-2 row-start-2",
                        )}
                        style={{ zIndex: playOrder + 1 }}
                    >
                        {played ? (
                            <div
                                className="size-full origin-center"
                                style={{ transform: `rotate(${rotation}deg)` }}
                            >
                                <PlayingCard
                                    card={played.card}
                                    size="sm"
                                    className={cn(
                                        "w-full",
                                        key &&
                                            flyingCardKeys?.has(key) &&
                                            "invisible",
                                    )}
                                />
                            </div>
                        ) : null}
                    </div>
                );
            })}

            {playedCards.length === 0 ? (
                <p className="pointer-events-none absolute inset-0 grid place-items-center text-center text-[13px] font-semibold text-mint/60 felt-short:text-[12px] felt-short:leading-tight">
                    {emptyLabel}
                </p>
            ) : null}
        </div>
    );
}
