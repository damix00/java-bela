import type { ComponentProps } from "react";

import { cn } from "@/lib/ui/cn";
import { panel, type Surface } from "@/lib/ui/styles";

/**
 * Bordered box that rules off each child from the next.
 *
 * On the felt the frame goes and the rule thins to a hairline: the rows are
 * already one block, darker than the field and casting one shadow, so the rule
 * only has to say where a row ends rather than draw a box around each. The
 * corners have to clip, or the first and last rows square off the radius the
 * panel just asked for.
 */
export default function DividedPanel({
    surface = "brut",
    className,
    ...props
}: ComponentProps<"div"> & { surface?: Surface }) {
    return (
        <div
            className={cn(
                "flex flex-col",
                surface === "felt"
                    ? // Spelled out rather than built from `hairline`: Tailwind
                      // scans source text for whole class names, and a variant
                      // interpolated from a constant is never one.
                      [
                          panel,
                          "overflow-hidden [&>*+*]:border-t [&>*+*]:border-mint/15",
                      ]
                    : "border-4 border-ink [&>*+*]:border-t-4 [&>*+*]:border-ink",
                className,
            )}
            {...props}
        />
    );
}
