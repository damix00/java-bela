import Eyebrow from "@/components/ui/typography/Eyebrow";
import { cn } from "@/lib/cn";

type LabeledRuleProps = {
  children: string;
  className?: string;
};

/** Horizontal rule broken by a word — the "or" between two ways in. */
export default function LabeledRule({ children, className }: LabeledRuleProps) {
  return (
    <div className={cn("flex items-center gap-3.5", className)}>
      <span aria-hidden className="h-[3px] flex-1 bg-ash" />
      <Eyebrow className="font-normal">{children}</Eyebrow>
      <span aria-hidden className="h-[3px] flex-1 bg-ash" />
    </div>
  );
}
