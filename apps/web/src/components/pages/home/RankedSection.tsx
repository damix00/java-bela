import { card, lift } from "@/components/pages/home/styles";
import { cn } from "@/lib/cn";

export default function RankedSection() {
  return (
    <section
      id="ranked"
      className="scroll-mt-24 border-b-4 border-ink px-5 py-16 md:px-14 md:py-20"
    >
      <h2 className="m-0 mb-3 font-display text-[34px] leading-[1.1] font-extrabold tracking-[-.035em] sm:text-[42px] lg:text-[50px]">
        Built for people who keep score
      </h2>
      <p className="m-0 mb-11 max-w-[54ch] text-[19px] leading-[1.6] text-moss">
        Bela is a game of counting, signalling and nerve. The app should treat
        it that way.
      </p>

      <div className="grid gap-[22px] md:grid-cols-2 lg:auto-rows-[172px] lg:grid-cols-4">
        <div
          className={cn(
            lift,
            "flex min-h-[172px] flex-col justify-between gap-8 border-4 border-ink bg-rust p-8 shadow-hard-lg md:col-span-2 lg:row-span-2",
          )}
        >
          <div className="flex items-end gap-[7px]">
            <span className="h-[44px] w-4 border-[3px] border-ink bg-cream" />
            <span className="h-[68px] w-4 border-[3px] border-ink bg-cream" />
            <span className="h-24 w-4 border-[3px] border-ink bg-ember" />
          </div>
          <div>
            <p className="m-0 max-w-[13ch] font-display text-[34px] leading-[1.06] font-extrabold tracking-[-.035em] text-cream sm:text-[42px]">
              A ladder that can go down
            </p>
            <p className="m-0 mt-4 max-w-[36ch] text-[17px] leading-[1.55] font-medium text-ember">
              Every ranked hand moves your rating both ways. Placement games to
              start, seasons that reset, and a leaderboard your club can argue
              about.
            </p>
          </div>
        </div>

        <div
          className={cn(
            lift,
            card,
            "min-h-[172px] justify-center gap-2.5 bg-cream md:col-span-2",
          )}
        >
          <p className="m-0 font-display text-[27px] font-extrabold tracking-[-.03em] text-ink">
            One link, four seats
          </p>
          <p className="m-0 text-[16px] leading-[1.55] text-moss">
            Private tables for the people you actually play with. Send a link,
            they sit down.
          </p>
        </div>

        <div
          className={cn(lift, card, "min-h-[172px] justify-between bg-forest")}
        >
          <span className="size-7 rounded-full border-[3px] border-mint-line" />
          <p className="m-0 text-[16px] leading-[1.5] font-medium text-mint-soft">
            No ads. No coins. Nothing to buy mid-hand.
          </p>
        </div>

        <div
          className={cn(lift, card, "min-h-[172px] justify-between bg-sage")}
        >
          <div className="flex items-end gap-2">
            <span className="h-[34px] w-[22px] border-[3px] border-ink bg-cream" />
            <span className="h-[26px] w-10 border-[3px] border-ink bg-cream" />
          </div>
          <p className="m-0 text-[16px] leading-[1.5] font-medium text-ink">
            Phone, tablet, browser. Same account, same table.
          </p>
        </div>

        <div
          className={cn(
            lift,
            card,
            "min-h-[172px] justify-center gap-2.5 bg-cream shadow-hard-rust md:col-span-2",
          )}
        >
          <p className="m-0 font-display text-[27px] font-extrabold tracking-[-.03em] text-ink">
            An AI that counts trumps
          </p>
          <p className="m-0 text-[16px] leading-[1.55] text-moss">
            Offline practice against opponents that remember every card played —
            and will call contra when you deserve it.
          </p>
        </div>

        <div
          className={cn(
            lift,
            card,
            "min-h-[172px] justify-between bg-ink shadow-hard-rust",
          )}
        >
          <span className="text-[26px] text-rust">♦</span>
          <p className="m-0 text-[16px] leading-[1.5] text-ash">
            Hand history and replays after every game.
          </p>
        </div>

        <div
          className={cn(lift, card, "min-h-[172px] justify-between bg-sage")}
        >
          <span className="size-[26px] rotate-45 border-[3px] border-ink" />
          <p className="m-0 text-[16px] leading-[1.5] font-medium text-ink">
            Fair-play checks on every ranked table.
          </p>
        </div>
      </div>
    </section>
  );
}
