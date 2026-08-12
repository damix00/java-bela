import WaitlistForm from "@/components/pages/home/blocks/WaitlistForm";
import Heading from "@/components/ui/typography/Heading";
import Section from "@/components/layout/Section";
import Text from "@/components/ui/typography/Text";

export default function WaitlistSection() {
  return (
    <Section
      id="waitlist"
      tone="forest"
      className="flex flex-col items-start gap-[26px] md:py-[88px]"
    >
      <Heading size="statement" tone="cream">
        Deal us in.
      </Heading>
      <Text size="lg" tone="mint" weight="medium">
        One email when belote.gg opens. That&rsquo;s it.
      </Text>
      <WaitlistForm
        id="waitlist-email"
        submitLabel="Join the waitlist"
        inputTone="cream"
        inputClassName="sm:w-[300px]"
      />
    </Section>
  );
}
