import WaitlistForm from "@/components/pages/home/blocks/WaitlistForm";
import Heading from "@/components/ui/typography/Heading";
import Section from "@/components/layout/Section";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";

type WaitlistSectionProps = {
  copy: Dictionary["waitlist"];
  form: Dictionary["form"];
};

export default function WaitlistSection({ copy, form }: WaitlistSectionProps) {
  return (
    <Section
      id="waitlist"
      tone="forest"
      className="flex flex-col items-start gap-[26px] md:py-[88px]"
    >
      <Heading size="statement" tone="cream">
        {copy.heading}
      </Heading>
      <Text size="lg" tone="mint" weight="medium">
        {copy.sub}
      </Text>
      <WaitlistForm
        id="waitlist-email"
        submitLabel={copy.submit}
        copy={form}
        inputTone="cream"
        inputClassName="sm:w-[300px]"
      />
    </Section>
  );
}
