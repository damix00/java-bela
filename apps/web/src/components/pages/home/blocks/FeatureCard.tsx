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
 * Small bento tile: an icon up top, a few words below. Always sage — the
 * surface marks it as a supporting tile, so the grid stays readable.
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
