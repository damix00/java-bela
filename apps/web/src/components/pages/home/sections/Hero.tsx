import JoinCta from "@/components/pages/home/blocks/cta/JoinCta";
import Heading from "@/components/ui/typography/Heading";
import MediaPanel from "@/components/ui/surfaces/MediaPanel";
import Section from "@/components/layout/Section";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";

type HeroProps = {
    copy: Dictionary["hero"];
    cta: Dictionary["cta"];
    locale: Locale;
};

export default function Hero({ copy, cta, locale }: HeroProps) {
    return (
        <Section
            tone="sage"
            className="grid items-center gap-14 py-14 md:pt-[84px] md:pb-[76px] lg:grid-cols-[1.05fr_.95fr]"
        >
            <div className="flex flex-col items-start gap-[30px]">
                {/* Two keys, not one sentence split at render time: the accent phrase
            is a translation unit of its own, and where it falls in the
            sentence differs by language. */}
                <Heading as="h1" size="hero">
                    {copy.headingLead}{" "}
                    <span className="box-decoration-clone bg-rust px-[.1em] text-cream">
                        {copy.headingAccent}
                    </span>
                </Heading>
                <Text size="xl" className="max-w-[34ch] text-pretty">
                    {copy.sub}
                </Text>
                <JoinCta
                    label={copy.cta}
                    locale={locale}
                    signIn={{ prompt: cta.haveAccount, label: cta.signIn }}
                />
            </div>

            <MediaPanel
                caption={copy.caption}
                shadow="rust"
                className="hidden md:aspect-[4/3] md:grid"
            />
        </Section>
    );
}
