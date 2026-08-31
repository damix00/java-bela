"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/controls/Button";
import DeclarationList from "@/components/pages/game/blocks/controls/DeclarationList";
import { declarationPoints } from "@/lib/game/rules";
import type { Declaration, Type } from "@bela/protocol";

type DeclarationsDialogProps = {
    heading: string;
    /** The side that was tapped. Never empty — see `ScoreBoard`. */
    label: string;
    declarations: Declaration[];
    /** `game.declarations.types` — what each set is called. */
    typeNames: Record<Type, string>;
    totalLabel: string;
    closeLabel: string;
    nameOf: (seat: number) => string;
    onClose: () => void;
};

/**
 * One side's declarations, in full, opened from its half of the scoreboard.
 *
 * The felt only ever has room for the totals, and during play it does not even
 * have that — so the one place the cards can always be checked is here. It is
 * opened by tapping the score that raised the question, and only a side that
 * declared something can be tapped, so this never has to say "nothing".
 */
export default function DeclarationsDialog({
    heading,
    label,
    declarations,
    typeNames,
    totalLabel,
    closeLabel,
    nameOf,
    onClose,
}: DeclarationsDialogProps) {
    const reduceMotion = useReducedMotion();

    // Escape closes it. The dialog is opened from a bar that is otherwise
    // click-through, so the backdrop is the only other way out.
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={heading}
            className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={
                    reduceMotion ? false : { opacity: 0, scale: 0.98, y: 8 }
                }
                animate={{ opacity: 1, scale: 1, y: 0 }}
                // The panel is inside the backdrop's click target, so it has to
                // stop the click that would otherwise close it.
                onClick={(event) => event.stopPropagation()}
                className="flex max-h-[80dvh] w-full max-w-[440px] flex-col gap-4 overflow-y-auto rounded-2xl bg-baize-deep p-5 shadow-[0_12px_36px_-10px_rgb(0_0_0_/_0.6)]"
            >
                <div className="flex items-baseline justify-between gap-3 border-b border-mint/15 pb-2">
                    <p className="font-display text-[19px] font-extrabold tracking-[-.02em] text-cream">
                        {heading}
                        <span className="text-[13px] font-semibold text-mint/70">
                            {" · "}
                            {label}
                        </span>
                    </p>
                    <span className="shrink-0 text-[12px] font-semibold text-mint/70 tabular-nums sm:text-[14px]">
                        {totalLabel.replace(
                            "{points}",
                            String(declarationPoints(declarations)),
                        )}
                    </span>
                </div>

                <DeclarationList
                    declarations={declarations}
                    typeNames={typeNames}
                    nameOf={nameOf}
                />

                <Button
                    size="sm"
                    tone="cream"
                    soft
                    onClick={onClose}
                    className="self-center px-5"
                >
                    {closeLabel}
                </Button>
            </motion.div>
        </div>
    );
}
