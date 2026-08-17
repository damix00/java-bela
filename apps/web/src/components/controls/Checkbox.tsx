import { Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

type CheckboxProps = Omit<ComponentProps<"input">, "type" | "children"> & {
  children: ReactNode;
};

/**
 * The native control, hidden and driven from its own box — the browser's
 * checkbox can't be given a 4px ink border, and a `div` with a click handler
 * would lose the keyboard and the form value.
 *
 * The tick lives inside the box and is revealed with `peer-checked:[&_svg]`:
 * the variant resolves against the box, which *is* the input's sibling, while
 * the selector reaches down to the glyph it contains.
 */
export default function Checkbox({
  className,
  children,
  ...props
}: CheckboxProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-[11px] text-[15px] leading-[1.5] text-moss",
        className,
      )}
    >
      <input type="checkbox" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className="grid size-[22px] shrink-0 place-items-center border-4 border-ink bg-white [&_svg]:hidden peer-checked:bg-forest peer-checked:[&_svg]:block peer-focus-visible:outline-4 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-rust"
      >
        <Check className="size-[14px] text-cream" strokeWidth={4} />
      </span>
      <span>{children}</span>
    </label>
  );
}
