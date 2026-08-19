import MockLabel from "@/components/pages/table/blocks/MockLabel";
import { mockTable } from "@/components/pages/table/mock-data";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/cn";

type RankMeterProps = {
  copy: Dictionary["table"];
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
export default function RankMeter({ copy, className }: RankMeterProps) {
  const filled = [true, true, true, false, false];

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

      <div
        role="img"
        aria-label={`${copy.progressLabel}: ${copy.rankProgress.replace("{rank}", mockTable.rank)}`}
        className="flex w-[132px] gap-[3px]"
      >
        {filled.map((isFilled, index) => (
          <span
            key={index}
            className={cn(
              "h-[7px] flex-1 border-[1.5px] border-ink",
              isFilled ? "bg-rust" : "bg-moss",
            )}
          />
        ))}
      </div>

      {/* The season countdown is the reason to care about the bar above it, so
          it goes when there is no room to say why. */}
      <MockLabel className="hidden whitespace-nowrap text-[9px] tracking-[.1em] text-ash/70 xl:block">
        {copy.seasonLabel}
      </MockLabel>
    </div>
  );
}
