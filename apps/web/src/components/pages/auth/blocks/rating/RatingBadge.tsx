import Card from "@/components/ui/surfaces/Card";
import Eyebrow from "@/components/ui/typography/Eyebrow";
import Text from "@/components/ui/typography/Text";

type RatingBadgeProps = {
    rating: string;
    label: string;
    meta: string;
};

/** The number a returning player is signing back in for. */
export default function RatingBadge({ rating, label, meta }: RatingBadgeProps) {
    return (
        <Card
            padding="none"
            className="flex-row items-center gap-[18px] self-start px-5 py-[18px]"
        >
            <span className="font-display text-[44px] leading-none font-extrabold tracking-[-.04em] text-ink">
                {rating}
            </span>
            <span className="flex flex-col gap-[3px]">
                <Eyebrow className="font-normal">{label}</Eyebrow>
                <Text as="span" size="xs" className="font-semibold text-forest">
                    {meta}
                </Text>
            </span>
        </Card>
    );
}
