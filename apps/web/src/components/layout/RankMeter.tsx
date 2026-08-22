import MockLabel from "@/components/pages/table/blocks/shared/MockLabel";
import { mockTable } from "@/components/pages/table/mock-data";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/cn";

type RankMeterProps = {
    copy: Dictionary["table"];
    /**
     * `compact` is the phone's version: the same three facts laid on one line,
     * for a bar that is only as tall as an avatar.
     */
    variant?: "full" | "compact";
    className?: string;
};

/**
 * Where you stand, in the top bar and nowhere else.
 *
 * This is the whole of what used to be the lobby's right-hand rail. The rail
 * was a column of standings beside a table whose only question is *do you want
 * to play*, and the answer to that question is never in a leaderboard — the
 * ladder and the match history have a page of their own coming. What survives
 * is the glance: the number, the band it sits in, and how far the band has
 * left to run.
 *
 * The five segments are the mock's stand-in for a progress bar. The precise
 * version of the same fact — the points left to the next band, the position in
 * the season — is `rankProgress`, which the bar carries as its label: a number
 * that exact is worth reading aloud but not worth three more lines of chrome in
 * a 76px bar.
 */
export default function RankMeter({
    copy,
    variant = "full",
    className,
}: RankMeterProps) {
    const filled = [true, true, true, false, false];
    const compact = variant === "compact";

    const meter = (
        <div
            role="img"
            aria-label={`${copy.progressLabel}: ${copy.rankProgress.replace("{rank}", mockTable.rank)}`}
            className={cn("flex gap-[3px]", compact ? "w-14" : "w-[132px]")}
        >
            {filled.map((isFilled, index) => (
                <span
                    key={index}
                    className={cn(
                        "flex-1 border-[1.5px] border-ink",
                        compact ? "h-[5px]" : "h-[7px]",
                        isFilled ? "bg-rust" : "bg-moss",
                    )}
                />
            ))}
        </div>
    );

    // On a phone the rating and its band go side by side and the meter tucks in
    // after them, because the bar has one line to give and stacking would cost it
    // the height it saved by dropping the username.
    if (compact) {
        return (
            <div className={cn("shrink-0 items-center gap-2", className)}>
                <strong className="font-display text-[16px] leading-none font-extrabold tracking-[-.04em] text-cream">
                    {mockTable.rating}
                </strong>
                {/* The band name is the first thing to go on the narrowest phones —
                    the number it qualifies is still there without it. */}
                <MockLabel className="hidden text-[9px] tracking-[.12em] text-ash min-[380px]:block">
                    {mockTable.band}
                </MockLabel>
                {meter}
            </div>
        );
    }

    return (
        <div className={cn("shrink-0 flex-col items-end gap-[3px]", className)}>
            <div className="flex items-baseline gap-2">
                <strong className="font-display text-[20px] leading-none font-extrabold tracking-[-.04em] text-cream">
                    {mockTable.rating}
                </strong>
                <MockLabel className="text-[10px] tracking-[.12em] text-ash">
                    {mockTable.band}
                </MockLabel>
            </div>

            {meter}

            {/* The season countdown is the reason to care about the bar above it, so
          it goes when there is no room to say why. */}
            <MockLabel className="hidden whitespace-nowrap text-[9px] tracking-[.1em] text-ash/70 xl:block">
                {copy.seasonLabel}
            </MockLabel>
        </div>
    );
}
