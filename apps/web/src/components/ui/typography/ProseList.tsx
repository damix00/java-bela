import Text from "@/components/ui/typography/Text";
import { cn } from "@/lib/ui/cn";

type ProseListProps = {
    items: readonly string[];
    className?: string;
};

/**
 * The bullet list for long-form prose. A ruled left edge instead of a dot —
 * a disc would be the one round thing on a page built from 4px corners.
 */
export default function ProseList({ items, className }: ProseListProps) {
    return (
        <ul className={cn("m-0 flex list-none flex-col gap-3 p-0", className)}>
            {items.map((item, index) => (
                // Keyed by position: these are translated sentences, so the list's
                // identity is its order, not its text.
                <li key={index} className="border-l-4 border-ink pl-4">
                    <Text as="span" size="md" tone="ink">
                        {item}
                    </Text>
                </li>
            ))}
        </ul>
    );
}
