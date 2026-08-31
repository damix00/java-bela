"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/controls/Button";
import DeclarationList from "@/components/pages/game/blocks/controls/DeclarationList";
import { declarationPoints } from "@/lib/game/rules";
import type { Declaration, Type } from "@bela/protocol";

type DeclarationsPanelProps = {
    /** The server-resolved declarations currently credited to both teams. */
    mine: Declaration[];
    theirs: Declaration[];
    heading: string;
    promptHeading: string;
    promptBody: string;
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
    /** The local player appears in the currently winning declaration set. */
    canDecide: boolean;
    /** The server has acknowledged that this player opted out. */
    declined: boolean;
    chair: number;
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
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl bg-baize-deep px-3 py-3 text-center shadow-[0_4px_14px_-6px_rgb(0_0_0_/_0.5)] sm:px-4 sm:py-4">
            <span className="truncate text-[9px] font-bold tracking-wide text-mint/70 uppercase sm:text-[11px]">
                {label}
            </span>
            <span className="font-display text-[20px] leading-none font-extrabold tracking-[-.03em] text-cream sm:text-[26px]">
                +{declarationPoints(declarations)}
            </span>

            {/* No empty state here — the `+0` above already says it, and a
                side that declared nothing does not need a sentence about it.
                A short screen has the tray and nothing to spare in it; the
                score bar opens the same cards in full whenever it does not. */}
            <DeclarationList
                declarations={declarations}
                typeNames={typeNames}
                nameOf={nameOf}
                className="mt-1 items-center [@media(max-height:700px)]:hidden"
            />
        </div>
    );
}

/**
 * Zvanja — first the private decision, then the table's resolved totals.
 *
 * The protocol defaults a player to declaring and only has an opt-out command.
 * That is kept as a transport detail: visually, nothing is revealed until the
 * player has explicitly answered yes or no. A no waits for the fresh server
 * snapshot before showing the recomputed totals, so the summary never flashes
 * points that were just withheld.
 */
export default function DeclarationsPanel({
    mine,
    theirs,
    heading,
    promptHeading,
    promptBody,
    mineLabel,
    theirsLabel,
    noneLabel,
    declareLabel,
    declineLabel,
    updatingLabel,
    totalLabel,
    typeNames,
    nameOf,
    canDecide,
    declined,
    chair,
    onDecline,
}: DeclarationsPanelProps) {
    const reduceMotion = useReducedMotion();
    const [choice, setChoice] = useState<"declare" | "decline" | null>(null);
    const mineTotal = declarationPoints(mine);
    const theirsTotal = declarationPoints(theirs);
    const playerTotal = declarationPoints(
        mine.filter((declaration) => declaration.playerIndex === chair),
    );
    const mode =
        canDecide && !declined && choice === null
            ? "prompt"
            : choice === "decline" && !declined
              ? "pending"
              : "summary";

    const reveal = reduceMotion ? undefined : { opacity: 1, scale: 1, y: 0 };

    if (mode === "prompt") {
        return (
            <motion.div
                key="prompt"
                initial={
                    reduceMotion ? false : { opacity: 0, scale: 0.98, y: 6 }
                }
                animate={reveal}
                className="flex w-full flex-col items-center gap-2 text-center sm:gap-3 [@media(max-height:560px)]:flex-row [@media(max-height:560px)]:justify-center [@media(max-height:560px)]:gap-3"
            >
                <p className="font-display text-[15px] font-extrabold whitespace-nowrap tracking-[-.02em] text-cream sm:text-[18px] [@media(max-height:560px)]:text-[14px]">
                    {promptHeading}
                </p>
                <p className="max-w-[260px] text-[11px] leading-snug font-medium text-mint/75 sm:text-[13px] [@media(max-height:560px)]:hidden">
                    {promptBody.replace("{points}", String(playerTotal))}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                    <Button
                        size="sm"
                        soft
                        onClick={() => setChoice("declare")}
                        className="px-3 py-2 text-[13px] sm:px-5 sm:py-[11px] sm:text-[15px]"
                    >
                        {declareLabel}
                    </Button>
                    <Button
                        tone="cream"
                        size="sm"
                        soft
                        onClick={() => {
                            setChoice("decline");
                            onDecline();
                        }}
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
