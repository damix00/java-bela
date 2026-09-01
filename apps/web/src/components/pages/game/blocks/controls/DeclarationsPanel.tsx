"use client";

import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/controls/Button";
import DeclarationList from "@/components/pages/game/blocks/controls/DeclarationList";
import { declarationPoints } from "@/lib/game/rules";
import type { Declaration, Type } from "@bela/protocol";
import { cn } from "@/lib/ui/cn";
import { panelNested } from "@/lib/ui/styles";

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
                "flex min-w-0 flex-1 flex-col items-center gap-1.5 px-3 py-3 text-center sm:px-4 sm:py-4",
            )}
        >
            <span className="truncate text-[9px] font-bold tracking-wide text-mint/70 uppercase sm:text-[11px]">
                {label}
            </span>
            <span className="font-display text-[20px] leading-none font-extrabold tracking-[-.03em] text-cream sm:text-[26px]">
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
                className="mt-1 items-center"
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

    const reveal = reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 };
    const transition = reduceMotion
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 320, damping: 32, mass: 0.8 };

    if (mode === "prompt") {
        return (
            <motion.div
                key="prompt"
                initial={
                    reduceMotion ? false : { opacity: 0, scale: 0.98, y: 6 }
                }
                animate={reveal}
                transition={transition}
                className="flex w-full flex-col items-center gap-2 text-center sm:gap-3 [@media(max-height:560px)]:flex-row [@media(max-height:560px)]:justify-center [@media(max-height:560px)]:gap-3"
            >
                <p className="font-display text-[15px] font-extrabold whitespace-nowrap tracking-[-.02em] text-cream sm:text-[18px] [@media(max-height:560px)]:text-[14px]">
                    {promptHeading}
                </p>
                <p className="max-w-[260px] text-[11px] leading-snug font-medium text-mint/75 sm:text-[13px] [@media(max-height:560px)]:hidden">
                    {playerTotal > 0
                        ? promptBody.replace("{points}", String(playerTotal))
                        : promptBodyNone}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                    <Button
                        size="sm"
                        soft
                        onClick={onDeclare}
                        className="px-3 py-2 text-[13px] sm:px-5 sm:py-[11px] sm:text-[15px]"
                    >
                        {declareLabel}
                    </Button>
                    <Button
                        tone="cream"
                        size="sm"
                        soft
                        onClick={onDecline}
                        className="px-3 py-2 text-[13px] sm:px-5 sm:py-[11px] sm:text-[15px]"
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
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 6 }}
            animate={reveal}
            transition={transition}
            aria-live="polite"
            className="flex w-full flex-col items-center gap-2 sm:gap-3 [@media(max-height:560px)]:flex-row [@media(max-height:560px)]:justify-center"
        >
            <div className="text-center">
                <p className="font-display text-[14px] font-extrabold tracking-[-.02em] text-cream sm:text-[17px]">
                    {heading}
                </p>
                <p className="text-[10px] font-bold tracking-wide text-mint/70 uppercase sm:text-[12px]">
                    {totalLabel.replace("{points}", String(combinedTotal))}
                </p>
            </div>

            {combinedTotal === 0 ? (
                <p className="text-[12px] font-semibold text-mint/65 sm:text-[13px]">
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
