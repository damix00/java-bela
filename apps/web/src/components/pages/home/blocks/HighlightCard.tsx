import type { ReactNode } from "react";

import Card from "@/components/ui/surfaces/Card";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";

type HighlightCardProps = {
    title: string;
    children: ReactNode;
};

/**
 * Wide bento tile: a headline and one line under it, vertically centred.
 * Sage, like every other neutral tile in the grid — the band under it is cream,
 * and a tile that repeats its band's surface has only its border to exist by.
 * Width and the missing icon badge are what keep this apart from `FeatureCard`.
 */
export default function HighlightCard({ title, children }: HighlightCardProps) {
    return (
        <Card
            tone="sage"
            className="min-h-[172px] justify-center gap-2.5 md:col-span-2">
            <Heading as="h3" size="card">
                {title}
            </Heading>
            <Text size="md">{children}</Text>
        </Card>
    );
}
