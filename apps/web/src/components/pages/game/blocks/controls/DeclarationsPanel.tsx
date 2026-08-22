"use client";

import { Button } from "@/components/controls/Button";
import PlayingCard from "@/components/pages/game/blocks/cards/PlayingCard";
import { cardKey } from "@/lib/game-rules";
import type { Declaration, Type } from "@bela/protocol";

type DeclarationsPanelProps = {
    /** Everything credited this round, both teams. */
    mine: Declaration[];
    theirs: Declaration[];
    /** Display names for `Declaration.type`. */
    names: Record<Type, string>;
    heading: string;
    mineLabel: string;
    theirsLabel: string;
    noneLabel: string;
    declineLabel: string;
    /** Hidden once declined, or when there is nothing of yours to withhold. */
    canDecline: boolean;
    onDecline: () => void;
};

function Row({
    declarations,
    label,
    names,
    noneLabel,
}: {
    declarations: Declaration[];
    label: string;
    names: Record<Type, string>;
    noneLabel: string;
}) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[12px] font-bold tracking-wide text-mint/70 uppercase">
                {label}
            </span>

            {declarations.length === 0 ? (
                <span className="text-[13px] font-semibold text-mint/60">
                    {noneLabel}
                </span>
            ) : (
                declarations.map((declaration, index) => (
                    <div
                        key={`${declaration.type}-${declaration.playerIndex}-${index}`}
                        className="flex flex-wrap items-center gap-2"
                    >
                        <span className="font-display text-[15px] font-extrabold text-cream">
                            {names[declaration.type]}
                        </span>
                        <span className="text-[13px] font-bold text-mint">
                            +{declaration.points}
                        </span>

                        <span className="flex">
                            {(declaration.cards ?? []).map((card) => (
                                <PlayingCard
                                    key={cardKey(card)}
                                    card={card}
                                    size="sm"
                                    className="-ml-6 w-8 first:ml-0 sm:w-8"
                                />
                            ))}
                        </span>
                    </div>
                ))
            )}
        </div>
    );
}

/**
 * Zvanja — the sequences and sets that score before a card is played.
 *
 * The server has already worked out who wins the contest and credited only that
 * team, so this reports rather than tallies. The one live decision is whether to
 * withhold your own: declaring shows the table part of your hand, and there are
 * rounds where that costs more than the points are worth.
 *
 * Declining is not required. The phase ends on its own timer either way, which
 * is what makes it safe to leave this as the only control here.
 */
export default function DeclarationsPanel({
    mine,
    theirs,
    names,
    heading,
    mineLabel,
    theirsLabel,
    noneLabel,
    declineLabel,
    canDecline,
    onDecline,
}: DeclarationsPanelProps) {
    return (
        <div className="flex w-full flex-col gap-3">
            <p className="text-center font-display text-[16px] font-extrabold tracking-[-.02em] text-cream">
                {heading}
            </p>

            <Row
                declarations={mine}
                label={mineLabel}
                names={names}
                noneLabel={noneLabel}
            />
            <Row
                declarations={theirs}
                label={theirsLabel}
                names={names}
                noneLabel={noneLabel}
            />

            {canDecline && (
                <Button
                    tone="cream"
                    size="sm"
                    onClick={onDecline}
                    className="self-center"
                >
                    {declineLabel}
                </Button>
            )}
        </div>
    );
}
