import { Ban, Rewind, ShieldCheck, Smartphone, TrendingUp } from "lucide-react";

import Section from "@/components/layout/Section";
import FeatureCard from "@/components/pages/home/blocks/FeatureCard";
import HighlightCard from "@/components/pages/home/blocks/HighlightCard";
import Card from "@/components/ui/surfaces/Card";
import Heading from "@/components/ui/typography/Heading";
import { IconBadge } from "@/components/ui/graphics/Icon";
import Text from "@/components/ui/typography/Text";

/**
 * Bento grid on a three-surface system: rust for the one lead tile, cream for
 * the wide headline tiles, sage for the small supporting ones. Every tile
 * carries the same ink shadow.
 */
export default function RankedSection() {
    return (
        <Section id="ranked">
            <Heading className="mb-3">Built for people who keep score</Heading>
            <Text size="lg" className="mb-11">
                Counting, signalling, nerve — scored properly.
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
                            A ladder that can go down
                        </Heading>
                        <Text
                            size="lg"
                            tone="ember"
                            weight="medium"
                            className="mt-4 max-w-[26ch]">
                            Win, climb. Lose, drop. Seasons reset.
                        </Text>
                    </div>
                </Card>

                <HighlightCard title="One link, four seats">
                    Send it. They sit down.
                </HighlightCard>

                <FeatureCard glyph={Ban}>No ads. No coins.</FeatureCard>

                <FeatureCard glyph={Smartphone}>
                    Phone, tablet, browser.
                </FeatureCard>

                <HighlightCard title="An AI that counts trumps">
                    Offline. Remembers every card.
                </HighlightCard>

                <FeatureCard glyph={Rewind}>
                    Replays after every hand.
                </FeatureCard>

                <FeatureCard glyph={ShieldCheck}>
                    Fair play on ranked tables.
                </FeatureCard>
            </div>
        </Section>
    );
}
