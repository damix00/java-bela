import { ButtonLink } from "@/components/controls/Button";
import Heading from "@/components/ui/typography/Heading";
import MediaPanel from "@/components/ui/surfaces/MediaPanel";
import Section from "@/components/layout/Section";
import Text from "@/components/ui/typography/Text";

export default function LeaderboardSection() {
  return (
    <Section padded={false} className="grid items-stretch lg:grid-cols-2">
      <MediaPanel
        caption="screenshot — leaderboard / season standings"
        bordered={false}
        className="min-h-[440px] border-b-4 border-ink lg:border-r-4 lg:border-b-0"
      />
      <div className="flex flex-col justify-center gap-[26px] bg-forest px-5 py-16 md:px-14 md:py-20">
        <Heading tone="cream" className="max-w-[16ch]">
          Everyone at your table thinks they&rsquo;re the best.
        </Heading>
        <Text size="xl" tone="mint" weight="medium" className="max-w-[34ch]">
          Settle it. One rating, one leaderboard, every hand on the record —
          Bela, Belot, contra and rekontra.
        </Text>
        <ButtonLink href="#waitlist" size="lg" className="self-start">
          Claim your rank
        </ButtonLink>
      </div>
    </Section>
  );
}
