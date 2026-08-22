import { Button } from "@/components/controls/Button";
import PlacementCard from "@/components/pages/auth/blocks/rating/PlacementCard";
import { demoAccount } from "@/components/pages/auth/placeholders";
import Card from "@/components/ui/surfaces/Card";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";

type WelcomeScreenProps = {
    copy: Dictionary["auth"]["welcome"];
};

/**
 * A landing beat rather than a dead end: the account exists, and both buttons
 * lead to a game — one alone, one with the usual three.
 */
export default function WelcomeScreen({ copy }: WelcomeScreenProps) {
    return (
        <Card
            tone="forest"
            shadow="rust"
            padding="none"
            className="flex-wrap items-center gap-12 p-8 sm:p-12 lg:flex-row lg:px-14 lg:py-16"
        >
            <div className="flex min-w-[min(380px,100%)] flex-1 flex-col gap-[22px]">
                <Heading
                    as="h1"
                    size="statement"
                    tone="cream"
                    className="max-w-[20ch]"
                >
                    {copy.heading} {demoAccount.username}
                </Heading>
                <Text size="lg" tone="mint" className="max-w-[44ch]">
                    {copy.body}
                </Text>
                <div className="flex flex-wrap gap-[18px]">
                    <Button
                        tone="rust"
                        size="lg"
                        className="py-[17px] text-[18px]"
                    >
                        {copy.primary}
                    </Button>
                    <Button
                        tone="cream"
                        size="lg"
                        className="py-[17px] text-[18px]"
                    >
                        {copy.secondary}
                    </Button>
                </div>
            </div>

            <PlacementCard
                label={copy.placement}
                played={demoAccount.placementPlayed}
                total={demoAccount.placementTotal}
            />
        </Card>
    );
}
