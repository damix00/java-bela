import { ButtonLink } from "@/components/controls/Button";
import Chip from "@/components/ui/surfaces/Chip";
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
            {/* Half-width from lg up, so this panel keeps its own inset instead of
          inheriting the page gutter — that one is sized for full-bleed bands. */}
            <div className="flex flex-col justify-center gap-[26px] bg-forest px-8 py-16 md:px-14 md:py-20 lg:px-16 xl:px-24">
                <Heading tone="cream" className="max-w-[16ch]">
                    Everyone at your table thinks they&rsquo;re the best.
                </Heading>
                <Text size="xl" tone="mint" weight="medium">
                    One rating. One leaderboard. Every hand on the record.
                </Text>
                <ButtonLink href="#waitlist" size="lg" className="self-start">
                    Claim your rank
                </ButtonLink>
            </div>
        </Section>
    );
}
