import Text from "@/components/ui/typography/Text";
import { cn } from "@/lib/ui/cn";

// One square per perk, cycling through the palette in order. The colour says
// nothing — it keeps three stacked lines from reading as one grey block.
const swatches = ["bg-mint", "bg-rust", "bg-cream"] as const;

type PerkListProps = {
    items: string[];
    className?: string;
};

/** What an account buys you, one boxed square per line. */
export default function PerkList({ items, className }: PerkListProps) {
    return (
        <ul className={cn("m-0 flex list-none flex-col gap-4 p-0", className)}>
            {items.map((item, index) => (
                <li key={item} className="flex items-start gap-3.5">
                    <span
                        aria-hidden
                        className={cn(
                            "mt-[3px] size-[18px] shrink-0 rounded-full",
                            swatches[index % swatches.length],
                        )}
                    />
                    <Text surface="felt" as="span" size="sm" tone="cream">
                        {item}
                    </Text>
                </li>
            ))}
        </ul>
    );
}
