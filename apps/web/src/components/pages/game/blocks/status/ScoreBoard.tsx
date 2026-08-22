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
    roundLabel,
}: ScoreBoardProps) {
    return (
        <section
            aria-label={targetLabel.replace("{target}", String(target))}
            className="mx-auto flex w-full max-w-[560px] flex-wrap items-center justify-center gap-x-6 gap-y-2 border-4 border-ink bg-baize-deep px-4 py-3 shadow-hard-sm lg:max-w-[1000px]"
        >
            {[
                { label: usLabel, total: usTotal, round: usRound },
                { label: themLabel, total: themTotal, round: themRound },
            ].map((side) => (
                <div key={side.label} className="flex items-baseline gap-2">
                    <span className="text-[12px] font-bold tracking-wide text-mint/70 uppercase">
                        {side.label}
                    </span>
                    <span className="font-display text-[22px] font-extrabold tracking-[-.02em] text-cream">
                        {side.total}
                    </span>
                    <span className="text-[13px] font-semibold text-mint/75">
                        {roundLabel.replace("{points}", String(side.round))}
                    </span>
                </div>
            ))}

            <span className="text-[12px] font-semibold text-mint/60">
                {targetLabel.replace("{target}", String(target))}
            </span>

            {trumpSuite && (
                <span className="flex items-center gap-2">
                    <span className="text-[12px] font-bold tracking-wide text-mint/70 uppercase">
                        {trumpLabel}
                    </span>
                    <Image
                        src={HUNGARIAN_SUIT_ASSETS[trumpSuite]}
                        alt=""
                        width={22}
                        height={22}
                        className="size-[22px] object-contain"
                    />
                    <span className="font-display text-[15px] font-extrabold text-cream">
                        {trumpName}
                    </span>
                </span>
            )}
        </section>
    );
}
