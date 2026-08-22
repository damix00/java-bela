"use client";

import Image from "next/image";

import { Button } from "@/components/controls/Button";
import { HUNGARIAN_SUIT_ASSETS } from "@/lib/card-assets";
import { cn } from "@/lib/cn";
import { focusRing, pressSm } from "@/lib/styles";
import { Suite } from "@bela/protocol";

type TrumpChooserProps = {
    /** Suit names, keyed by the wire enum. */
    suiteNames: Record<Suite, string>;
    heading: string;
    passLabel: string;
    mustCallNote: string;
    /** False once three players have passed — the fourth must call ("mora"). */
    canPass: boolean;
    onChoose: (suite: Suite) => void;
    onPass: () => void;
};

const SUITES = [Suite.HEARTS, Suite.BELLS, Suite.ACORN, Suite.LEAF];

/**
 * Calling trump: four pips and, usually, a way out.
 *
 * The pass disappears rather than greying out when it reaches the last chooser.
 * A disabled control invites a press and then explains itself; there is nothing
 * to decide here — they have to call — so the note takes its place.
 */
export default function TrumpChooser({
    suiteNames,
    heading,
    passLabel,
    mustCallNote,
    canPass,
    onChoose,
    onPass,
}: TrumpChooserProps) {
    return (
        <div className="flex flex-col items-center gap-3">
            <p className="font-display text-[16px] font-extrabold tracking-[-.02em] text-cream">
                {heading}
            </p>

            <div className="flex flex-wrap justify-center gap-2">
                {SUITES.map((suite) => (
                    <button
                        key={suite}
                        type="button"
                        onClick={() => onChoose(suite)}
                        aria-label={suiteNames[suite]}
                        className={cn(
                            "grid size-14 cursor-pointer place-items-center border-[3px] border-ink bg-cream shadow-hard-sm",
                            pressSm,
                            focusRing,
                        )}
                    >
                        <Image
                            src={HUNGARIAN_SUIT_ASSETS[suite]}
                            alt=""
                            width={32}
                            height={32}
                            className="size-8 object-contain"
                        />
                    </button>
                ))}
            </div>

            {canPass ? (
                <Button tone="cream" size="sm" onClick={onPass}>
                    {passLabel}
                </Button>
            ) : (
                <p className="text-[13px] font-semibold text-mint/75">
                    {mustCallNote}
                </p>
            )}
        </div>
    );
}
