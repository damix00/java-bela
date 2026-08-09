import type { ReactNode } from "react";

import Card from "@/components/ui/surfaces/Card";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";

type HighlightCardProps = {
    title: string;
    children: ReactNode;
};

/**
 * Wide bento tile: a headline and a short paragraph, vertically centred.
 * Always cream — the surface is what tells these apart from the small tiles.
 */
export default function HighlightCard({ title, children }: HighlightCardProps) {
    return (
        <Card className="min-h-[172px] justify-center gap-2.5 md:col-span-2">
            <Heading as="h3" size="card">
                {title}
            </Heading>
            <Text>{children}</Text>
        </Card>
    );
}
