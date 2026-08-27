import type { ComponentProps } from "react";

import { cn } from "@/lib/ui/cn";

/**
 * The table's annotation voice — every small caps label on the screen.
 *
 * Set in the body face, tracked wide and small: the labels are signposts for
 * the blocks they sit on, so they read as the quietest thing on the table
 * rather than as a second typeface competing with the display face above them.
 * `Eyebrow` is the same idea on the page's own surfaces.
 */
export default function MockLabel({
    className,
    ...props
}: ComponentProps<"span">) {
    return (
        <span
            className={cn(
                "font-sans text-[11px] font-bold tracking-[.14em] uppercase",
                className,
            )}
            {...props}
        />
    );
}
