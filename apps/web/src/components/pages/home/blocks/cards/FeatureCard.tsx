import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import Card from "@/components/ui/surfaces/Card";
import { IconBadge } from "@/components/ui/graphics/Icon";
import Text from "@/components/ui/typography/Text";

type FeatureCardProps = {
    /** Ornament pinned to the top of the tile. */
    glyph: LucideIcon;
    children: ReactNode;
};

/**
 * Small bento tile: an icon up top, a few words below. Sage, the counter-surface
 * to the cream band it sits on — see `HighlightCard`, which takes the same one.
 */
export default function FeatureCard({ glyph, children }: FeatureCardProps) {
    return (
        <Card tone="sage" className="min-h-[172px] justify-between">
            <IconBadge glyph={glyph} />
            <Text size="md" tone="ink" weight="medium">
                {children}
            </Text>
        </Card>
    );
}
