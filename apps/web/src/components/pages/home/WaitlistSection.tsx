import WaitlistForm from "@/components/pages/home/WaitlistForm";

export default function WaitlistSection() {
  return (
    <section
      id="waitlist"
      className="flex scroll-mt-24 flex-col items-start gap-[26px] border-b-4 border-ink bg-forest px-5 py-16 md:px-14 md:py-[88px]"
    >
      <h2 className="m-0 font-display text-[44px] leading-[1.05] font-extrabold tracking-[-.04em] text-cream sm:text-[54px] lg:text-[62px]">
        Deal us in.
      </h2>
      <p className="m-0 max-w-[44ch] text-[20px] leading-[1.55] font-medium text-mint">
        Join the waitlist and we&rsquo;ll send one email when belote.gg opens.
        That&rsquo;s the whole plan.
      </p>
      <WaitlistForm
        id="waitlist-email"
        inputClass="bg-cream sm:w-[300px]"
        buttonClass="bg-rust"
      />
    </section>
  );
}
