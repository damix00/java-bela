import { Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/ui/cn";
import type { Surface } from "@/lib/ui/styles";

type CheckboxProps = Omit<ComponentProps<"input">, "type" | "children"> & {
    children: ReactNode;
    surface?: Surface;
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
    surface = "brut",
    className,
    children,
    ...props
}: CheckboxProps) {
    const felt = surface === "felt";

    return (
        <label
            className={cn(
                "flex cursor-pointer items-start gap-[11px] text-[15px] leading-[1.5]",
                felt ? "text-mint" : "text-moss",
                className,
            )}
        >
            <input type="checkbox" className="peer sr-only" {...props} />
            <span
                aria-hidden
                // The flag sits on the hidden input, so the box it draws has to reach
                // back for it the same way it reaches for `:checked`.
                className={cn(
                    "grid size-[22px] shrink-0 place-items-center [&_svg]:hidden peer-checked:bg-forest peer-checked:[&_svg]:block peer-focus-visible:outline-4 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-rust",
                    felt
                        ? "rounded-md bg-baize-deep ring-1 ring-mint/20 peer-aria-invalid:ring-rust"
                        : "border-4 border-ink bg-white peer-aria-invalid:border-rust",
                )}
            >
                <Check className="size-[14px] text-cream" strokeWidth={4} />
            </span>
            <span>{children}</span>
        </label>
    );
}
