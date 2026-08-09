import { hatch, lift } from "@/components/pages/home/styles";
import { cn } from "@/lib/cn";

export default function LeaderboardSection() {
  return (
    <section className="grid items-stretch border-b-4 border-ink lg:grid-cols-2">
      <div
        className={cn(
          hatch,
          "grid min-h-[440px] place-items-center border-b-4 border-ink lg:border-r-4 lg:border-b-0",
        )}
      >
        <span className="border-[3px] border-ink bg-cream px-[14px] py-2 font-mono text-[13px] text-moss">
          screenshot — leaderboard / season standings
        </span>
      </div>
      <div className="flex flex-col justify-center gap-[26px] bg-forest px-5 py-16 md:px-14 md:py-20">
        <h2 className="m-0 max-w-[16ch] font-display text-[34px] leading-[1.08] font-extrabold tracking-[-.04em] text-cream sm:text-[42px] lg:text-[50px]">
          Everyone at your table thinks they&rsquo;re the best.
        </h2>
        <p className="m-0 max-w-[34ch] text-[22px] leading-[1.5] font-medium text-mint">
          Settle it. One rating, one leaderboard, every hand on the record —
          Bela, Belot, contra and rekontra.
        </p>
        <a
          href="#waitlist"
          className={cn(
            lift,
            "self-start border-4 border-ink bg-rust px-[26px] py-4 font-display text-[17px] font-extrabold text-cream no-underline shadow-hard hover:text-cream",
          )}
        >
          Claim your rank
        </a>
      </div>
    </section>
  );
}
