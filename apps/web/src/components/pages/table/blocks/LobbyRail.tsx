import MockLabel from "@/components/pages/table/blocks/MockLabel";
import SuitBadge from "@/components/pages/table/blocks/SuitBadge";
import { mockTable } from "@/components/pages/table/mock-data";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/cn";

type LobbyRailProps = {
  copy: Dictionary["table"];
};

/** The compact status rail that sits beside the matchmaking table. */
export default function LobbyRail({ copy }: LobbyRailProps) {
  return (
    <aside className="flex w-full flex-col gap-5 xl:max-w-[338px]">
      <section className="border-4 border-ink bg-cream p-5 shadow-hard">
        <MockLabel className="text-moss">{copy.seasonLabel}</MockLabel>
        <div className="mt-2 flex items-end justify-between gap-4">
          <strong className="font-display text-[46px] leading-none font-extrabold tracking-[-.06em] text-ink">
            {mockTable.rating}
          </strong>
          <strong className="pb-1 font-display text-[18px] font-extrabold tracking-[-.04em] text-ink">
            {mockTable.band}
          </strong>
        </div>
        <div aria-label={copy.progressLabel} className="mt-3 flex gap-[5px]">
          {[true, true, true, false, false].map((filled, index) => (
            <span
              key={index}
              className={cn(
                "h-5 flex-1 border-[3px] border-ink",
                filled ? "bg-forest" : "bg-canvas",
              )}
            />
          ))}
        </div>
        <p className="m-0 mt-2 text-[14px] font-medium text-moss">
          {copy.rankProgress.replace("{rank}", mockTable.rank)}
        </p>
      </section>

      <section className="border-4 border-ink bg-cream shadow-hard">
        <div className="border-b-4 border-ink px-4 py-3">
          <MockLabel className="text-moss">{copy.ladderLabel}</MockLabel>
        </div>
        <div className="[&>*+*]:border-t-2 [&>*+*]:border-canvas">
          {mockTable.ladder.map((player) => {
            const isYou = player.name === mockTable.you.name;
            return (
              <div
                key={player.name}
                className={cn(
                  "flex items-center gap-[10px] px-3 py-[10px]",
                  isYou && "border-l-4 border-l-rust bg-paper pl-2",
                )}
              >
                <span className="w-5 font-display text-[15px] font-extrabold text-ink">
                  {player.rank}.
                </span>
                <SuitBadge suit={player.suit} tone={player.tone} size="sm" />
                <span className="mr-auto truncate font-display text-[15px] font-extrabold tracking-[-.02em] text-ink">
                  {player.name}
                </span>
                <span className="font-sans text-[12px] font-semibold text-ink">
                  {player.rating}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-4 border-ink bg-cream px-5 py-4 shadow-hard">
        <MockLabel className="text-moss">{copy.lastFive}</MockLabel>
        <div className="mt-3 flex gap-2">
          {mockTable.lastFive.map((won, index) => (
            <span
              key={index}
              className={cn(
                "grid size-9 place-items-center border-[3px] border-ink font-sans text-[13px] font-bold text-cream",
                won ? "bg-forest" : "bg-rust",
              )}
            >
              {won ? copy.win : copy.loss}
            </span>
          ))}
        </div>
        <p className="m-0 mt-3 text-[14px] font-medium text-moss">
          {copy.lastFiveNote.replace("{opponent}", mockTable.partner.name)}
        </p>
      </section>
    </aside>
  );
}
