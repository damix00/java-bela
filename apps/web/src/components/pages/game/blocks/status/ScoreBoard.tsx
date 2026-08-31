import Image from "next/image";

import { HUNGARIAN_SUIT_ASSETS } from "@/lib/game/card-assets";
import { cn } from "@/lib/ui/cn";
import { focusRing, panel } from "@/lib/ui/styles";
import type { Suite } from "@bela/protocol";

type ScoreBoardProps = {
    usLabel: string;
    themLabel: string;
    /** The match score — what the round is being added to. */
    usTotal: number;
    themTotal: number;
    /** What this round has earned so far. The big number. */
    usRound: number;
    themRound: number;
    /** Declared, and not yet part of the round's own points. */
    usDeclarations: number;
    themDeclarations: number;
    target: number;
    targetLabel: string;
    trumpSuite: Suite | null;
    trumpLabel: string;
    trumpName: string | null;
    trumpCallerLabel: string | null;
    declarationsLabel: string;
    totalLabel: string;
    /** Opens that side's declarations. Only offered when it has any. */
    onShowDeclarations: (side: "us" | "them") => void;
    showDeclarationsLabel: string;
};

/**
 * The round, what has been declared on it, the match score, and the trump suit.
 *
 * The big number is *this round*, not the match: it is the one that moves while
 * you are playing, and it is what the hand in front of you is worth. What has
 * been declared rides beside it as a `+`, because it is promised rather than
 * won — and it is only drawn when there is something to draw. The match score
 * sits underneath, where it is there to be checked rather than watched.
 *
 * Framed as us and them rather than by team number. Which of the two Java
 * `Team`s a player belongs to is an implementation detail they never see, and
 * every read of this board is "am I ahead".
 */
/**
 * One half of the score, pressable only when it leads somewhere.
 *
 * The dock the board sits in is `pointer-events-none` so the felt underneath
 * stays reachable, which is why the interactive half has to opt back in.
 */
function Side({
    onShow,
    label,
    className,
    children,
}: {
    onShow?: () => void;
    label: string;
    className: string;
    children: React.ReactNode;
}) {
    if (!onShow) return <div className={className}>{children}</div>;

    return (
        <button
            type="button"
            onClick={onShow}
            aria-label={label}
            className={cn(
                className,
                "pointer-events-auto cursor-pointer transition-colors hover:bg-mint/5",
                focusRing,
            )}
        >
            {children}
        </button>
    );
}

export default function ScoreBoard({
    usLabel,
    themLabel,
    usTotal,
    themTotal,
    usRound,
    themRound,
    usDeclarations,
    themDeclarations,
    target,
    targetLabel,
    trumpSuite,
    trumpLabel,
    trumpName,
    trumpCallerLabel,
    declarationsLabel,
    totalLabel,
    onShowDeclarations,
    showDeclarationsLabel,
}: ScoreBoardProps) {
    const sides = [
        {
            side: "us" as const,
            label: usLabel,
            total: usTotal,
            round: usRound,
            declarations: usDeclarations,
        },
        {
            side: "them" as const,
            label: themLabel,
            total: themTotal,
            round: themRound,
            declarations: themDeclarations,
        },
    ];

    return (
        <section
            aria-label={targetLabel.replace("{target}", String(target))}
            className={cn(
                panel,
                "mx-auto grid w-full max-w-[560px] shrink-0 grid-cols-[1fr_auto_1fr] items-center px-3 sm:px-5 lg:max-w-[1000px]",
                // A height, not padding around whatever is inside. The trump
                // caller's line only appears once somebody has called, and a
                // bar that grew a row mid-hand shifted the whole table under
                // it. These are `scoreSpacerClass`'s numbers in `GameScreen`,
                // which is what reserves the row this is docked over — the two
                // have to agree or the bar overhangs the felt.
                "h-20 portrait-sm:h-18 flat:h-14 desk:h-22",
            )}
        >
            {sides.map((side, index) => (
                <Side
                    key={side.label}
                    // Nothing to open means nothing to press: a side that has
                    // declared nothing stays a plain block rather than a button
                    // onto an empty panel.
                    onShow={
                        side.declarations > 0
                            ? () => onShowDeclarations(side.side)
                            : undefined
                    }
                    label={`${side.label} · ${showDeclarationsLabel}`}
                    className={cn(
                        // One centred stack per side — name, round, match —
                        // read top to bottom. Pinned to the outer edges it read
                        // as two fragments of a sentence with a hole in the
                        // middle; centred in its own half it is a column of
                        // numbers about one team.
                        "flex min-w-0 flex-col items-center gap-0.5 justify-self-center rounded-xl px-2 py-1",
                        index === 0 ? "col-start-1" : "col-start-3 row-start-1",
                    )}
                >
                    <span className="text-[10px] font-bold tracking-wide text-mint/70 uppercase sm:text-[12px]">
                        {side.label}
                    </span>

                    <span className="flex items-baseline gap-1.5">
                        <span className="font-display text-[24px] leading-none font-extrabold tracking-[-.03em] text-cream tabular-nums sm:text-[28px] flat:text-[21px]">
                            {side.round}
                        </span>
                        {side.declarations > 0 ? (
                            <span className="text-[12px] font-bold text-mint tabular-nums sm:text-[14px]">
                                {declarationsLabel.replace(
                                    "{points}",
                                    String(side.declarations),
                                )}
                            </span>
                        ) : null}
                    </span>

                    <span
                        aria-label={totalLabel.replace(
                            "{points}",
                            String(side.total),
                        )}
                        className="text-[11px] leading-none font-semibold text-mint/60 tabular-nums sm:text-[13px] flat:text-[10px]"
                    >
                        {side.total}
                    </span>
                </Side>
            ))}

            <div className="col-start-2 row-start-1 flex min-w-20 max-w-[46%] items-center justify-center gap-2.5 px-5 desk:gap-3 desk:px-10 flat:px-4">
                {trumpSuite ? (
                    <Image
                        src={HUNGARIAN_SUIT_ASSETS[trumpSuite]}
                        alt=""
                        width={40}
                        height={40}
                        aria-label={`${trumpLabel}: ${trumpName ?? ""}`}
                        className="size-8 shrink-0 object-contain desk:size-10 flat:size-6"
                    />
                ) : null}
                <div className="flex min-w-0 flex-col items-start text-left">
                    {trumpCallerLabel ? (
                        <span className="text-[12px] font-bold whitespace-nowrap text-mint/80 desk:text-[14px] flat:text-[10px]">
                            {trumpCallerLabel}
                        </span>
                    ) : null}
                    <span className="text-[12px] font-semibold whitespace-nowrap text-mint/60 desk:text-[14px] flat:text-[10px]">
                        {targetLabel.replace("{target}", String(target))}
                    </span>
                </div>
            </div>
        </section>
    );
}
