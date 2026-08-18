import MockLabel from "@/components/pages/table/blocks/MockLabel";
import { mockTable } from "@/components/pages/table/mock-data";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/cn";

/**
 * The strip along the bottom: your standing, your last five, and how long the
 * queue is right now.
 *
 * Ink, like the header — the two dark bands pin the felt between them, which is
 * what makes the middle of the screen read as a table rather than a page with a
 * green background.
 */
export default function MockStatusBar({
  copy,
}: {
  copy: Dictionary["table"];
}) {
  return (
    <footer
      className={cn(
        "grid border-t-4 border-ink bg-ink md:grid-cols-3",
        // Rules between the cells, thinner than the page's 4px and in a colour
        // that can actually be seen against ink.
        "[&>*+*]:border-t-2 [&>*+*]:border-moss/60",
        "md:[&>*+*]:border-t-0 md:[&>*+*]:border-l-2",
      )}
    >
      <div className="flex items-center gap-4 px-6 py-5">
        <span className="font-display text-[34px] leading-none font-extrabold tracking-[-.04em] text-cream">
          {mockTable.rating}
        </span>
        <span className="flex flex-col gap-[6px]">
          <MockLabel className="text-ash">
            {mockTable.band} · {mockTable.rank}
          </MockLabel>
          <span className="font-sans text-[12px] font-semibold text-mint">
            ▲ {copy.trend.replace("{count}", mockTable.trend)}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-4 px-6 py-5">
        <MockLabel className="text-ash">{copy.lastFive}</MockLabel>
        <span className="flex gap-2">
          {mockTable.lastFive.map((won, index) => (
            <span
              key={index}
              className={cn(
                "grid size-8 place-items-center border-[3px] border-ink",
                "font-sans text-[13px] font-bold text-cream",
                won ? "bg-forest" : "bg-rust",
              )}
            >
              {won ? copy.win : copy.loss}
            </span>
          ))}
        </span>
      </div>

      <div className="flex items-center gap-4 px-6 py-5">
        <MockLabel className="text-ash">{copy.queueLabel}</MockLabel>
        <span className="ml-auto font-sans text-[13px] text-cream">
          {copy.queueValue}
        </span>
      </div>
    </footer>
  );
}
