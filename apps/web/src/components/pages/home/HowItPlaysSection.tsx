import { lift } from "@/components/pages/home/styles";
import { cn } from "@/lib/cn";

const steps = [
  {
    n: "01",
    title: "Open a table",
    body: "Bela or Belot, 701 or 1001 — and whether the result counts towards your rating.",
  },
  {
    n: "02",
    title: "Fill the seats",
    body: "Send the link to your usual four, or queue solo and let the ladder find you three opponents.",
  },
  {
    n: "03",
    title: "Play the hand",
    body: "Call adut, declare your zvanja, take your štihovi. The score sheet and the rating keep themselves.",
  },
];

export default function HowItPlaysSection() {
  return (
    <section
      id="play"
      className="scroll-mt-24 border-b-4 border-ink px-5 py-16 md:px-14 md:py-20"
    >
      <h2 className="m-0 mb-11 font-display text-[34px] leading-[1.1] font-extrabold tracking-[-.035em] sm:text-[42px] lg:text-[50px]">
        Sit down in three moves
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.n}
            className={cn(
              lift,
              "flex flex-col gap-3.5 border-4 border-ink bg-cream p-7 shadow-hard-lg",
            )}
          >
            <span className="font-display text-[42px] leading-none font-extrabold text-rust">
              {step.n}
            </span>
            <p className="m-0 font-display text-[24px] font-extrabold tracking-[-.03em]">
              {step.title}
            </p>
            <p className="m-0 text-[16px] leading-[1.55] text-moss">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
