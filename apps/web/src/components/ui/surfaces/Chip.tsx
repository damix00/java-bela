import type { ComponentProps } from "react";

import { cn } from "@/lib/ui/cn";

/** Small boxed tag — used for captions and annotations. */
export default function Chip({ className, ...props }: ComponentProps<"span">) {
    return (
        <span
            className={cn(
                "border-[3px] border-ink bg-cream px-[14px] py-2 text-[13px] text-moss",
                className,
            )}
            {...props}
        />
    );
}
