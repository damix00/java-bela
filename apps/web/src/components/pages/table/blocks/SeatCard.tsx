import MockLabel from "@/components/pages/table/blocks/MockLabel";
import SuitBadge from "@/components/pages/table/blocks/SuitBadge";
import type { BadgeTone } from "@/components/pages/table/mock-data";
import Card from "@/components/ui/surfaces/Card";
import { cn } from "@/lib/cn";

type SeatCardProps = {
    name: string;
    /** Everything under the name — partnership, rating, whose deal it is. */
    meta: string;
    suit: string;
    tone?: BadgeTone;
    /** The "you" tag. Only one seat at a table ever carries it. */
    tag?: string;
    className?: string;
};

/** A taken seat: who is in it, and what the table knows about them. */
export default function SeatCard({
    name,
    meta,
    suit,
    tone,
    tag,
    className,
}: SeatCardProps) {
    return (
        <Card
            padding="none"
            className={cn(
                "flex-row items-center gap-3 px-3 py-3 shadow-hard sm:gap-4 sm:px-4 sm:py-[14px]",
                className,
            )}
        >
            <SuitBadge suit={suit} tone={tone} />
            <span className="mr-auto flex flex-col gap-[3px]">
                <span className="font-display text-[17px] font-extrabold tracking-[-.02em] text-ink">
                    {name}
                </span>
                <span className="font-sans text-[12px] font-medium text-stone">
                    {meta}
                </span>
            </span>
            {tag && (
                <MockLabel className="border-[3px] border-ink bg-paper px-2 py-[6px] text-ink sm:px-3">
                    {tag}
                </MockLabel>
            )}
        </Card>
    );
}
