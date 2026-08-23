import Image from "next/image";

import { HUNGARIAN_SUIT_ASSETS } from "@/lib/card-assets";
import type { Suite } from "@bela/protocol";

type ScoreBoardProps = {
    usLabel: string;
    themLabel: string;
    usTotal: number;
    themTotal: number;
    usRound: number;
    themRound: number;
    target: number;
    targetLabel: string;
    trumpSuite: Suite | null;
    trumpLabel: string;
    trumpName: string | null;
    trumpCallerLabel: string | null;
    roundLabel: string;
};

/**
 * Both scores, this round's running points, and the trump suit.
 *
 * Framed as us and them rather than by team number. Which of the two Java
 * `Team`s a player belongs to is an implementation detail they never see, and
 * every read of this board is "am I ahead".
 */
export default function ScoreBoard({
    usLabel,
    themLabel,
    usTotal,
    themTotal,
    usRound,
    themRound,
    target,
    targetLabel,
    trumpSuite,
    trumpLabel,
    trumpName,
    trumpCallerLabel,
    roundLabel,
}: ScoreBoardProps) {
    const sides = [
        { label: usLabel, total: usTotal, round: usRound },
        { label: themLabel, total: themTotal, round: themRound },
    ];

    return (
        <section
            aria-label={targetLabel.replace("{target}", String(target))}
            className="mx-auto grid w-full max-w-[560px] shrink-0 grid-cols-[1fr_auto_1fr] items-center border-4 border-ink bg-baize-deep px-3 py-2 shadow-hard-sm sm:px-5 sm:py-3 lg:max-w-[1000px] [@media(max-height:560px)]:py-1.5"
        >
            {sides.map((side, index) => (
                <div
                    key={side.label}
                    className={
                        index === 0
                            ? "col-start-1 flex min-w-0 items-baseline gap-1.5 justify-self-start"
                            : "col-start-3 row-start-1 flex min-w-0 items-baseline gap-1.5 justify-self-end"
                    }
                >
                    <span className="text-[10px] font-bold tracking-wide text-mint/70 uppercase sm:text-[12px]">
                        {side.label}
                    </span>
                    <span className="font-display text-[24px] leading-none font-extrabold tracking-[-.03em] text-cream tabular-nums sm:text-[28px] [@media(max-height:560px)]:text-[21px]">
                        {side.total}
                    </span>
                    <span className="text-[10px] font-semibold text-mint/70 tabular-nums sm:text-[12px]">
                        {roundLabel.replace("{points}", String(side.round))}
                    </span>
                </div>
            ))}

            <div className="col-start-2 row-start-1 flex min-w-14 flex-col items-center justify-center gap-0.5 px-2 text-center">
                {trumpSuite ? (
                    <>
                        <span
                            className="flex items-center gap-1.5"
                            aria-label={`${trumpLabel}: ${trumpName ?? ""}`}
                        >
                            <Image
                                src={HUNGARIAN_SUIT_ASSETS[trumpSuite]}
                                alt=""
                                width={24}
                                height={24}
                                className="size-5 object-contain sm:size-6"
                            />
                            <span className="hidden font-display text-[13px] font-extrabold text-cream sm:inline">
                                {trumpName}
                            </span>
                        </span>
                        {trumpCallerLabel ? (
                            <span className="max-w-32 truncate text-[8px] leading-none font-bold whitespace-nowrap text-mint/80 sm:max-w-40 sm:text-[10px]">
                                {trumpCallerLabel}
                            </span>
                        ) : null}
                    </>
                ) : null}
                <span className="text-[9px] font-semibold whitespace-nowrap text-mint/60 sm:text-[11px]">
                    {targetLabel.replace("{target}", String(target))}
                </span>
            </div>
        </section>
    );
}
