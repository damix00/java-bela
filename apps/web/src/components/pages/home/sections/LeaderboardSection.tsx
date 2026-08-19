import { ButtonLink } from "@/components/controls/Button";
import Heading from "@/components/ui/typography/Heading";
import MediaPanel from "@/components/ui/surfaces/MediaPanel";
import Section from "@/components/layout/Section";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { authPath } from "@/lib/routes";

type LeaderboardSectionProps = {
    copy: Dictionary["leaderboard"];
    locale: Locale;
};

export default function LeaderboardSection({
    copy,
    locale,
}: LeaderboardSectionProps) {
    return (
        <Section padded={false} className="grid items-stretch lg:grid-cols-2">
            <MediaPanel
                caption={copy.caption}
                bordered={false}
                className="min-h-[440px] border-b-4 border-ink lg:border-r-4 lg:border-b-0"
            />
            {/* Half-width from lg up, so this panel keeps its own inset instead of
          inheriting the page gutter — that one is sized for full-bleed bands. */}
            <div className="flex flex-col justify-center gap-[26px] bg-forest px-8 py-16 md:px-14 md:py-20 lg:px-16 xl:px-24">
                <Heading tone="cream" className="max-w-[16ch]">
                    {copy.heading}
                </Heading>
                <Text size="xl" tone="mint" weight="medium">
                    {copy.sub}
                </Text>
                <ButtonLink
                    href={authPath(locale, "signUp")}
                    size="lg"
                    className="self-start"
                >
                    {copy.cta}
                </ButtonLink>
            </div>
        </Section>
    );
}
