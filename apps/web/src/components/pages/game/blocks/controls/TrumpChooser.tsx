"use client";

import Image from "next/image";

import { Button } from "@/components/controls/Button";
import { HUNGARIAN_SUIT_ASSETS } from "@/lib/game/card-assets";
import { cn } from "@/lib/ui/cn";
import { focusRing, panel } from "@/lib/ui/styles";
import { Suite } from "@bela/protocol";

type TrumpChooserProps = {
    /** Suit names, keyed by the wire enum. */
    suiteNames: Record<Suite, string>;
    heading: string;
    passLabel: string;
    mustCallNote: string;
    /** False once three players have passed — the fourth must call ("mora"). */
    canPass: boolean;
    /** Thumb tray on phones; compact table controls everywhere else. */
    variant?: "table" | "tray";
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
    variant = "table",
    onChoose,
    onPass,
}: TrumpChooserProps) {
    const tray = variant === "tray";

    return (
        <div
            className={cn(
                "flex items-center",
                tray
                    ? `${panel} w-full flex-col gap-2 px-3 py-2 [@media(max-height:560px)]:flex-row [@media(max-height:560px)]:gap-3 [@media(max-height:560px)]:py-1.5`
                    : "flex-col gap-1.5 sm:gap-3",
            )}
        >
            <p
                className={cn(
                    "text-center font-display leading-tight font-extrabold tracking-[-.02em] text-cream",
                    tray
                        ? "text-[14px] [@media(max-height:560px)]:mr-auto [@media(max-height:560px)]:whitespace-nowrap [@media(max-height:560px)]:text-[13px]"
                        : "text-[14px] sm:text-[16px]",
                )}
            >
                {heading}
            </p>

            <div
                className={cn(
                    tray
                        ? "flex items-center justify-center gap-2"
                        : "contents",
                )}
            >
                <div
                    className={cn(
                        tray
                            ? "flex items-center justify-center gap-1.5"
                            : "grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:justify-center sm:gap-2",
                    )}
                >
                    {SUITES.map((suite) => (
                        <button
                            key={suite}
                            type="button"
                            onClick={() => onChoose(suite)}
                            aria-label={suiteNames[suite]}
                            className={cn(
                                // A pip on a disc, not a block on a shadow: the
                                // suit is the whole target, so the frame around
                                // it should say as little as possible.
                                "grid cursor-pointer touch-manipulation place-items-center rounded-full bg-cream shadow-[0_2px_8px_-2px_rgb(0_0_0_/_0.45)] transition-transform duration-100 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
                                tray
                                    ? "size-11 [@media(max-height:560px)]:size-9"
                                    : "size-9 sm:size-14",
                                focusRing,
                            )}
                        >
                            <Image
                                src={HUNGARIAN_SUIT_ASSETS[suite]}
                                alt=""
                                width={32}
                                height={32}
                                className={cn(
                                    "object-contain",
                                    tray
                                        ? "size-6 [@media(max-height:560px)]:size-5"
                                        : "size-5 sm:size-8",
                                )}
                            />
                        </button>
                    ))}
                </div>

                {canPass ? (
                    <Button
                        tone="cream"
                        size="sm"
                        soft
                        onClick={onPass}
                        className={cn(
                            "touch-manipulation",
                            tray
                                ? "min-h-11 px-4 py-2 text-[13px] [@media(max-height:560px)]:min-h-9 [@media(max-height:560px)]:px-3 [@media(max-height:560px)]:py-1.5"
                                : "px-3 py-2 text-[13px] sm:px-5 sm:py-[11px] sm:text-[15px]",
                        )}
                    >
                        {passLabel}
                    </Button>
                ) : (
                    <p
                        className={cn(
                            "max-w-[220px] text-center text-[11px] leading-tight font-semibold text-mint/75 sm:text-[13px]",
                            tray &&
                                "[@media(max-height:560px)]:max-w-40 [@media(max-height:560px)]:text-left [@media(max-height:560px)]:text-[10px]",
                        )}
                    >
                        {mustCallNote}
                    </p>
                )}
            </div>
        </div>
    );
}
