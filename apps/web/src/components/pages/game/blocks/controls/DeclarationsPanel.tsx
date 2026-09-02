"use client";

import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/controls/Button";
import DeclarationList from "@/components/pages/game/blocks/controls/DeclarationList";
import { declarationPoints } from "@/lib/game/rules";
import type { Declaration, Type } from "@bela/protocol";
import { cn } from "@/lib/ui/cn";
import {
    panelNested,
    popEnterFrom,
    popEnterTo,
    popTransition,
} from "@/lib/ui/styles";

type DeclarationsPanelProps = {
    /** The server-resolved declarations currently credited to both teams. */
    mine: Declaration[];
    theirs: Declaration[];
    heading: string;
    promptHeading: string;
    promptBody: string;
    /** What the prompt says to a player holding nothing — which is most of them. */
    promptBodyNone: string;
    mineLabel: string;
    theirsLabel: string;
    noneLabel: string;
    declareLabel: string;
    declineLabel: string;
    updatingLabel: string;
    totalLabel: string;
    /** `game.declarations.types` — what each set is called. */
    typeNames: Record<Type, string>;
    /** Names the seat a set came from — whose cards these are. */
    nameOf: (seat: number) => string;
    /** My own zvanja, as the server told me — the only holdings it names while it asks. */
    my: Declaration[];
    /** The round is still asking; the resolved sets are not on the wire yet. */
    asking: boolean;
    /** The server has recorded this player's answer, whichever way it went. */
    answered: boolean;
    onDeclare: () => void;
    onDecline: () => void;
};

/**
 * One side's declarations: what it is worth, and the cards it was paid for.
 *
 * The cards are the point. Declaring reveals them to the table — that is the
 * cost the player is deciding whether to pay — so a summary that showed only a
 * number was taking the payment without ever delivering the goods.
 */
function Side({
    label,
    declarations,
    typeNames,
    nameOf,
}: {
    label: string;
    declarations: Declaration[];
    typeNames: Record<Type, string>;
    nameOf: (seat: number) => string;
}) {
    return (
        <div
            className={cn(
                panelNested,
                // No shadow on this one. `panelNested` casts one so a block can
                // lift off the felt it is laid on, and this block is not on the
                // felt — it is inside a panel that is already lifted, and a
                // second shadow within the same silhouette only muddies the
                // corner it shares with the first. The step in colour is what
                // separates it here.
                "shadow-none",
                "flex min-w-0 flex-1 flex-col items-center gap-2 px-4 py-3 text-center",
            )}
        >
            <span className="truncate text-[11px] font-bold tracking-wide text-mint/70 uppercase">
                {label}
            </span>
            <span className="font-display text-[22px] leading-none font-extrabold tracking-[-.03em] text-cream">
                +{declarationPoints(declarations)}
            </span>

            {/* No empty state here — the `+0` above already says it, and a
                side that declared nothing does not need a sentence about it.
                The cards remain visible at every table height: revealing them
                is what makes the declaration valid, so the points alone are
                not an adequate table summary. */}
            <DeclarationList
                declarations={declarations}
                typeNames={typeNames}
                nameOf={nameOf}
                className="mt-0.5 items-center"
            />
        </div>
    );
}

/**
 * Zvanja — first the private question, then the table's resolved totals.
 *
 * The question is asked of everyone, including the seats holding nothing: a
 * prompt that appeared only for players with zvanja would announce that somebody
 * has them, which is the one thing this phase is for keeping quiet. Whether this
 * player has answered is the server's to say, not local state — the round only
 * moves on once every seat has, so a client-side "I clicked it" would be lying
 * about what the table is waiting for.
 */
export default function DeclarationsPanel({
    mine,
    theirs,
    heading,
    promptHeading,
    promptBody,
    promptBodyNone,
    mineLabel,
    theirsLabel,
    noneLabel,
    declareLabel,
    declineLabel,
    updatingLabel,
    totalLabel,
    typeNames,
    nameOf,
    my,
    asking,
    answered,
    onDeclare,
    onDecline,
}: DeclarationsPanelProps) {
    const reduceMotion = useReducedMotion();
    const mineTotal = declarationPoints(mine);
    const theirsTotal = declarationPoints(theirs);
    const playerTotal = declarationPoints(my);
    const mode = asking ? (answered ? "pending" : "prompt") : "summary";

    const reveal = reduceMotion ? undefined : popEnterTo;
    const transition = reduceMotion ? { duration: 0 } : popTransition;

    if (mode === "prompt") {
        return (
            <motion.div
                key="prompt"
                initial={reduceMotion ? false : popEnterFrom}
                animate={reveal}
                transition={transition}
                className="flex w-fit max-w-full flex-col items-center gap-3 text-center [@media(max-height:560px)]:flex-row [@media(max-height:560px)]:justify-center [@media(max-height:560px)]:gap-3"
            >
                <p className="font-display text-[17px] font-extrabold whitespace-nowrap tracking-[-.02em] text-cream [@media(max-height:560px)]:text-[15px]">
                    {promptHeading}
                </p>
                <p className="max-w-[300px] text-[13px] leading-snug font-medium text-mint/75 [@media(max-height:560px)]:hidden">
                    {playerTotal > 0
                        ? promptBody.replace("{points}", String(playerTotal))
                        : promptBodyNone}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                    <Button
                        size="sm"
                        soft
                        onClick={onDeclare}
                        className="min-h-11"
                    >
                        {declareLabel}
                    </Button>
                    <Button
                        tone="cream"
                        size="sm"
                        soft
                        onClick={onDecline}
                        className="min-h-11"
                    >
                        {declineLabel}
                    </Button>
                </div>
            </motion.div>
        );
    }

    if (mode === "pending") {
        return (
            <motion.p
                key="pending"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={transition}
                aria-live="polite"
                className="text-center text-[13px] font-semibold text-mint/75"
            >
                {updatingLabel}
            </motion.p>
        );
    }

    const combinedTotal = mineTotal + theirsTotal;

    return (
        <motion.div
            key="summary"
            initial={reduceMotion ? false : popEnterFrom}
            animate={reveal}
            transition={transition}
            aria-live="polite"
            className="flex w-fit max-w-full flex-col items-center gap-3 [@media(max-height:560px)]:flex-row [@media(max-height:560px)]:justify-center"
        >
            <div className="text-center">
                <p className="font-display text-[17px] font-extrabold tracking-[-.02em] text-cream">
                    {heading}
                </p>
                <p className="text-[12px] font-bold tracking-wide text-mint/70 uppercase">
                    {totalLabel.replace("{points}", String(combinedTotal))}
                </p>
            </div>

            {combinedTotal === 0 ? (
                <p className="text-[13px] font-semibold text-mint/65">
                    {noneLabel}
                </p>
            ) : (
                <div className="flex w-full max-w-[380px] items-start justify-center gap-2">
                    {[
                        { label: mineLabel, declarations: mine },
                        { label: theirsLabel, declarations: theirs },
                    ]
                        // A side that declared nothing is not a `+0` worth
                        // printing — it is simply not part of this round's
                        // zvanja. When only one side declared, it takes the
                        // whole width, which is also the width its cards want.
                        .filter((side) => side.declarations.length > 0)
                        .map((side) => (
                            <Side
                                key={side.label}
                                label={side.label}
                                declarations={side.declarations}
                                typeNames={typeNames}
                                nameOf={nameOf}
                            />
                        ))}
                </div>
            )}
        </motion.div>
    );
}
