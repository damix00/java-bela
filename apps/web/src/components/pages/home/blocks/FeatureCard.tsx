import type { ReactNode } from "react";

import Card from "@/components/ui/surfaces/Card";
import Text from "@/components/ui/typography/Text";

type FeatureCardProps = {
    /** Ornament pinned to the top of the tile. */
    mark: ReactNode;
    children: ReactNode;
};

/**
 * Small bento tile: an ornament up top, one line of copy below. Always sage —
 * the surface marks it as a supporting tile, so the grid stays readable.
 */
export default function FeatureCard({ mark, children }: FeatureCardProps) {
    return (
        <Card tone="sage" className="min-h-[172px] justify-between">
            {/* Fixed band keeps the copy on one baseline across every tile. */}
            <span className="flex h-9 items-center">{mark}</span>
            <Text size="sm" tone="ink" weight="medium">
                {children}
            </Text>
        </Card>
    );
}
