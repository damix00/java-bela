import PlayingCard from "@/components/pages/game/blocks/cards/PlayingCard";
import { cardKey } from "@/lib/game/rules";
import { cn } from "@/lib/ui/cn";
import type { Declaration, Type } from "@bela/protocol";

type DeclarationListProps = {
    declarations: Declaration[];
    /** `game.declarations.types`, keyed by the protocol's `Type`. */
    typeNames: Record<Type, string>;
    /** Only the felt summary has an empty state; the dialog cannot be empty. */
    noneLabel?: string;
    /** Names the seat each set came from, when there is room to say it. */
    nameOf?: (seat: number) => string;
    /**
     * How big to draw the cards. The felt tray is cramped and takes `xs`; the
     * dialog is a page of its own and can afford cards worth looking at.
     */
    cardSize?: "xs" | "sm";
    className?: string;
};

/**
 * What a side actually declared, cards and all.
 *
 * This is the half of zvanja the table used to be missing. A declaration is a
 * trade: the points are only yours if you show the cards, which is the whole
 * reason declining is a choice worth offering — and the board was quietly
 * taking the points while never showing what had been paid for them. Every set
 * here is laid out as its name, what it is worth, and the cards themselves.
 */
export default function DeclarationList({
    declarations,
    typeNames,
    noneLabel,
    nameOf,
    cardSize = "xs",
    className,
}: DeclarationListProps) {
    if (declarations.length === 0) {
        if (!noneLabel) return null;

        return (
            <p
                className={cn(
                    "text-[12px] font-semibold text-mint/60",
                    className,
                )}
            >
                {noneLabel}
            </p>
        );
    }

    return (
        // `min-w-0` is load-bearing: a centred flex parent does not shrink a
        // child below its min-content, so `w-full` alone left the list growing
        // to the width of its widest header and spilling out of both sides of
        // the box it was sitting in.
        <ul className={cn("flex w-full min-w-0 flex-col gap-3", className)}>
            {declarations.map((declaration, index) => (
                <li
                    // Nothing on a declaration is unique on its own — a table
                    // can hold two identical sequences in different suits from
                    // two different seats — so the cards are what identify it.
                    key={`${declaration.playerIndex}-${declaration.type}-${declaration.cards
                        .map(cardKey)
                        .join("")}-${index}`}
                    className="flex flex-col gap-2"
                >
                    <div className="flex w-full min-w-0 items-baseline justify-between gap-2">
                        <span className="min-w-0 truncate text-[11px] font-bold text-cream sm:text-[13px]">
                            {typeNames[declaration.type]}
                            {nameOf ? (
                                <span className="font-semibold text-mint/60">
                                    {" · "}
                                    {nameOf(declaration.playerIndex)}
                                </span>
                            ) : null}
                        </span>
                        <span className="shrink-0 font-display text-[13px] font-extrabold text-mint tabular-nums sm:text-[15px]">
                            +{declaration.points}
                        </span>
                    </div>

                    {/* Under its own heading, not floating in the middle of the
                        box: the cards belong to the line that names them, and a
                        centred row read as unrelated to it. The felt tray centres
                        the whole list from outside, so it is unaffected. */}
                    <div className="flex flex-wrap justify-start gap-2">
                        {declaration.cards.map((card) => (
                            <PlayingCard
                                key={cardKey(card)}
                                card={card}
                                size={cardSize}
                            />
                        ))}
                    </div>
                </li>
            ))}
        </ul>
    );
}
