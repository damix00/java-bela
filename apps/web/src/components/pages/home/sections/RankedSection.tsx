import { Ban, Rewind, ShieldCheck, Smartphone, TrendingUp } from "lucide-react";

import Section from "@/components/layout/Section";
import FeatureCard from "@/components/pages/home/blocks/FeatureCard";
import HighlightCard from "@/components/pages/home/blocks/HighlightCard";
import Card from "@/components/ui/surfaces/Card";
import Heading from "@/components/ui/typography/Heading";
import { IconBadge } from "@/components/ui/graphics/Icon";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";

type RankedSectionProps = {
    copy: Dictionary["ranked"];
};

/**
 * Bento grid on two surfaces: rust for the one lead tile, sage for every other
 * one. This is the one cream band on the page, so the tiles take sage — the
 * bands around it are sage and carry cream blocks instead. Either way a tile
 * never repeats the colour under it. Tile kinds are told apart by width and by
 * the icon badge, not by colour. Every tile carries the same ink shadow.
 */
export default function RankedSection({ copy }: RankedSectionProps) {
    return (
        <Section id="ranked">
            <Heading className="mb-3">{copy.heading}</Heading>
            <Text size="lg" className="mb-11">
                {copy.sub}
            </Text>

            <div className="grid gap-[22px] md:grid-cols-2 lg:auto-rows-[minmax(172px,auto)] lg:grid-cols-4">
                <Card
                    tone="rust"
                    padding="lg"
                    className="justify-between gap-8 md:col-span-2 lg:row-span-2">
                    <IconBadge
                        glyph={TrendingUp}
                        size="lg"
                        className="size-14"
                    />
                    <div>
                        <Heading
                            as="h3"
                            size="cardHero"
                            tone="cream"
                            className="max-w-[13ch]">
                            {copy.ladder.title}
                        </Heading>
                        <Text
                            size="lg"
                            tone="mint"
                            weight="medium"
                            className="mt-4 max-w-[26ch]">
                            {copy.ladder.body}
                        </Text>
                    </div>
                </Card>

                <HighlightCard title={copy.invite.title}>
                    {copy.invite.body}
                </HighlightCard>

                <FeatureCard glyph={Ban}>{copy.noAds}</FeatureCard>

                <FeatureCard glyph={Smartphone}>{copy.devices}</FeatureCard>

                <HighlightCard title={copy.ai.title}>
                    {copy.ai.body}
                </HighlightCard>

                <FeatureCard glyph={Rewind}>{copy.replays}</FeatureCard>

                <FeatureCard glyph={ShieldCheck}>{copy.fairPlay}</FeatureCard>
            </div>
        </Section>
    );
}
