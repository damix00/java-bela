import WaitlistForm from "@/components/pages/home/WaitlistForm";
import { hatch } from "@/components/pages/home/styles";
import { cn } from "@/lib/cn";

export default function Hero() {
  return (
    <section className="grid items-center gap-14 border-b-4 border-ink px-5 py-14 md:px-14 md:pt-[84px] md:pb-[76px] lg:grid-cols-[1.05fr_.95fr]">
      <div className="flex flex-col items-start gap-[30px]">
        <h1 className="m-0 font-display text-[40px] leading-[1.12] font-extrabold tracking-[-.04em] text-balance sm:text-[56px] lg:text-[72px]">
          Bela online, with a rank that{" "}
          <span className="box-decoration-clone bg-rust px-[.1em] text-cream">
            actually counts.
          </span>
        </h1>
        <p className="m-0 max-w-[38ch] text-[21px] leading-[1.6] text-moss text-pretty">
          Competitive Bela on a real ELO ladder. Sit down with your usual four,
          or queue solo and let the rating decide who you get.
        </p>
        <WaitlistForm
          id="hero-email"
          inputClass="bg-white sm:w-[280px]"
          buttonClass="bg-forest"
        />
      </div>

      <div
        className={cn(
          hatch,
          "grid aspect-[4/3] place-items-center border-4 border-ink shadow-hard-xl",
        )}
      >
        <span className="border-[3px] border-ink bg-cream px-[14px] py-2 font-mono text-[13px] text-moss">
          hero shot — ranked table, mid-hand
        </span>
      </div>
    </section>
  );
}
