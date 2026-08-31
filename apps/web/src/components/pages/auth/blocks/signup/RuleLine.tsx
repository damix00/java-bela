import { cn } from "@/lib/ui/cn";

type RuleLineProps = {
    children: string;
    /** Filled square once the rule is satisfied. */
    met?: boolean;
};

/**
 * The one requirement under the password field. Stated as a rule that fills in
 * rather than an error that appears — nothing is wrong yet, the field is just
 * not finished.
 */
export default function RuleLine({ children, met = false }: RuleLineProps) {
    return (
        <p
            className={cn(
                "m-0 flex items-center gap-[9px] pt-[3px] text-[12px]",
                met ? "text-mint" : "text-mint/50",
            )}
        >
            <span
                aria-hidden
                className={cn(
                    "size-3.5 shrink-0 rounded-full",
                    met ? "bg-mint" : "bg-mint/15",
                )}
            />
            {children}
        </p>
    );
}
