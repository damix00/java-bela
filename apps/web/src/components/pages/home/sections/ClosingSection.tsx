import Section from "@/components/layout/Section";
import JoinCta from "@/components/pages/home/blocks/cta/JoinCta";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";

type ClosingSectionProps = {
    copy: Dictionary["closing"];
    locale: Locale;
};

/**
 * Closing band: one way in, one scroll after the last argument. Sign-in isn't
 * repeated here — anyone who already has an account has the header for that.
 */
export default function ClosingSection({ copy, locale }: ClosingSectionProps) {
    return (
        <Section
            id="join"
            tone="forest"
            className="flex flex-col items-start gap-[26px] md:py-[88px]"
        >
            <Heading size="statement" tone="cream">
                {copy.heading}
            </Heading>
            <Text size="lg" tone="mint" weight="medium">
                {copy.sub}
            </Text>
            {/* Rust here — forest would vanish into the band. */}
            <JoinCta label={copy.cta} locale={locale} tone="rust" />
        </Section>
    );
}
