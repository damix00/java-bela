"use client";

import DeclarationList from "@/components/pages/game/blocks/controls/DeclarationList";
import Card from "@/components/ui/surfaces/Card";
import Modal from "@/components/ui/surfaces/Modal";
import { declarationPoints } from "@/lib/game/rules";
import type { Declaration, Type } from "@bela/protocol";
import { hairline } from "@/lib/ui/styles";

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
 *
 * It used to draw its own scrim, its own `Esc` listener and its own backdrop
 * click, and had no focus trap at all. `Modal` owns every one of those — and
 * its `onClose` branch exists for exactly this, a dialog opened from component
 * state with no history entry to unwind.
 *
 * The "Close" button it used to carry at the foot went with them. There is
 * nothing to decide here — it is a thing to read — so the shell's own close
 * control is the whole of the way out, as it is on every other dialog.
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
    return (
        <Modal
            surface="felt"
            closeLabel={closeLabel}
            onClose={onClose}
            className="max-w-[440px]"
        >
            <Card surface="felt" padding="none" className="gap-6 p-5 sm:p-6">
                {/* `pr-9` keeps the total clear of the close button, which the
                    shell draws over this corner. */}
                <div
                    className={`flex items-baseline justify-between gap-3 border-b pr-9 pb-3 ${hairline}`}
                >
                    <p className="font-display text-[17px] font-extrabold tracking-[-.02em] text-cream">
                        {heading}
                        <span className="text-[13px] font-semibold text-mint/70">
                            {" · "}
                            {label}
                        </span>
                    </p>
                    <span className="shrink-0 text-[13px] font-semibold text-mint/70 tabular-nums">
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
                    cardSize="sm"
                    className="gap-6"
                />
            </Card>
        </Modal>
    );
}
