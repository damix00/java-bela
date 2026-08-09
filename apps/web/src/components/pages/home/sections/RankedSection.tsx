import Section from "@/components/layout/Section";
import FeatureCard from "@/components/pages/home/blocks/FeatureCard";
import HighlightCard from "@/components/pages/home/blocks/HighlightCard";
import {
    BalanceMark,
    BarsMark,
    CardsMark,
    ReplayMark,
    RingMark,
} from "@/components/pages/home/blocks/marks";
import Card from "@/components/ui/surfaces/Card";
import Heading from "@/components/ui/typography/Heading";
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
            <Text size="lg" className="mb-11 max-w-[54ch]">
                Bela is a game of counting, signalling and nerve. The app should
                treat it that way.
            </Text>

            <div className="grid gap-[22px] md:grid-cols-2 lg:auto-rows-[minmax(172px,auto)] lg:grid-cols-4">
                <Card
                    tone="rust"
                    padding="lg"
                    className="justify-between gap-8 md:col-span-2 lg:row-span-2">
                    <BarsMark />
                    <div>
                        <Heading
                            as="h3"
                            size="cardHero"
                            tone="cream"
                            className="max-w-[13ch]">
                            A ladder that can go down
                        </Heading>
                        <Text
                            size="md"
                            tone="ember"
                            weight="medium"
                            className="mt-4 max-w-[36ch]">
                            Every ranked hand moves your rating both ways.
                            Placement games to start, seasons that reset, and a
                            leaderboard your club can argue about.
                        </Text>
                    </div>
                </Card>

                <HighlightCard title="One link, four seats">
                    Private tables for the people you actually play with. Send a
                    link, they sit down.
                </HighlightCard>

                <FeatureCard mark={<RingMark />}>
                    No ads. No coins. Nothing to buy mid-hand.
                </FeatureCard>

                <FeatureCard mark={<CardsMark />}>
                    Phone, tablet, browser. Same account, same table.
                </FeatureCard>

                <HighlightCard title="An AI that counts trumps">
                    Offline practice against opponents that remember every card
                    played — and will call contra when you deserve it.
                </HighlightCard>

                <FeatureCard mark={<ReplayMark />}>
                    Hand history and replays after every game.
                </FeatureCard>

                <FeatureCard mark={<BalanceMark />}>
                    Fair-play checks on every ranked table.
                </FeatureCard>
            </div>
        </Section>
    );
}
