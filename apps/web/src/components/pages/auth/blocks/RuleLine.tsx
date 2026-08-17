import { cn } from "@/lib/cn";

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
        "m-0 flex items-center gap-[9px] pt-[3px] font-mono text-[12px]",
        met ? "text-forest" : "text-stone",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-3.5 shrink-0 border-[3px] border-ink",
          met ? "bg-forest" : "bg-canvas",
        )}
      />
      {children}
    </p>
  );
}
