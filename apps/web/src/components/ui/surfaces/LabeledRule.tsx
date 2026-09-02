import Eyebrow from "@/components/ui/typography/Eyebrow";
import { cn } from "@/lib/ui/cn";
import type { Surface } from "@/lib/ui/styles";

/**
 * The rule's own weight, per surface.
 *
 * `ash` is a warm light grey drawn for the cream page; on the felt it is the
 * brightest thing in the panel and reads as a stray from another screen. The
 * felt draws its dividers in mint at low alpha — the same idiom as `hairline`
 * and `edge` — so the rule is found rather than announced.
 */
const rules = {
    brut: "bg-ash",
    felt: "bg-mint/25",
} as const;

type LabeledRuleProps = {
    children: string;
    /** Which visual language it is drawn in. See `Surface`. */
    surface?: Surface;
    className?: string;
};

/** Horizontal rule broken by a word — the "or" between two ways in. */
export default function LabeledRule({
    children,
    surface = "brut",
    className,
}: LabeledRuleProps) {
    return (
        <div className={cn("flex items-center gap-3.5", className)}>
            <span
                aria-hidden
                className={cn("h-[3px] flex-1", rules[surface])}
            />
            <Eyebrow surface={surface} className="font-normal">
                {children}
            </Eyebrow>
            <span
                aria-hidden
                className={cn("h-[3px] flex-1", rules[surface])}
            />
        </div>
    );
}
