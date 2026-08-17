import type { ReactNode } from "react";

import Eyebrow from "@/components/ui/typography/Eyebrow";
import Text from "@/components/ui/typography/Text";
import { cn } from "@/lib/cn";

type FieldProps = {
  /** Must match the `id` of the control passed as `children`. */
  htmlFor: string;
  label: string;
  /** Sits opposite the label — a "Forgot?" link, a character count. */
  action?: ReactNode;
  /** Note under the field: a rule, a hint, a validation line. */
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** A labelled field: caps label on top, control, optional note underneath. */
export default function Field({
  htmlFor,
  label,
  action,
  hint,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-[7px]", className)}>
      <div className="flex items-baseline gap-3">
        <Eyebrow as="label" htmlFor={htmlFor} className="mr-auto">
          {label}
        </Eyebrow>
        {action}
      </div>
      {children}
      {/* A string gets the standard hint treatment; a node — the password
          rule, the strength meter — is trusted to style itself. */}
      {typeof hint === "string" ? <Text size="xs">{hint}</Text> : hint}
    </div>
  );
}
