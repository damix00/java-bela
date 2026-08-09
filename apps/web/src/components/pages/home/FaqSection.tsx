import { cn } from "@/lib/cn";

const faqs = [
  {
    q: "Is it free?",
    a: "Yes. Ranked play, private tables and every variant — no ads and nothing to buy.",
  },
  {
    q: "Do my friends need an account?",
    a: "Only the host does. Everyone else joins straight from the link.",
  },
  {
    q: "What if someone disconnects?",
    a: "The hand pauses and holds their seat. Rejoin from any device and pick up where you left off.",
  },
  {
    q: "Can I play offline?",
    a: "Yes — against the AI, with no signal and no queue.",
  },
];

export default function FaqSection() {
  return (
    <section
      id="faq"
      className="grid scroll-mt-24 gap-14 border-b-4 border-ink bg-sage px-5 py-16 md:px-14 md:py-20 lg:grid-cols-[1fr_1.25fr]"
    >
      <h2 className="m-0 font-display text-[34px] leading-[1.08] font-extrabold tracking-[-.035em] sm:text-[42px] lg:text-[46px]">
        Questions before you sit down
      </h2>
      <div className="flex flex-col border-4 border-ink">
        {faqs.map((faq, i) => (
          <div
            key={faq.q}
            className={cn(
              "bg-cream px-6 py-[22px]",
              i < faqs.length - 1 && "border-b-4 border-ink",
            )}
          >
            <p className="m-0 mb-1.5 font-display text-[20px] font-extrabold tracking-[-.02em]">
              {faq.q}
            </p>
            <p className="m-0 text-[16px] leading-[1.55] text-moss">{faq.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
