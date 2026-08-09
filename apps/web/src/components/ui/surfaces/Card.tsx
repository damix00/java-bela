import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";
import { lift } from "@/lib/styles";

const tones = {
    cream: "bg-cream",
    sage: "bg-sage",
    forest: "bg-forest",
    rust: "bg-rust",
    ink: "bg-ink",
} as const;

// Cards cast one shadow colour on purpose — a second one reads as a mistake
// next to the first. Rust is reserved for the hero's MediaPanel.
const shadows = {
    none: "",
    ink: "shadow-hard-lg",
} as const;

const paddings = {
    none: "",
    md: "p-7",
    lg: "p-8",
} as const;

type CardProps = ComponentProps<"div"> & {
    tone?: keyof typeof tones;
    shadow?: keyof typeof shadows;
    padding?: keyof typeof paddings;
    /** Slides toward its shadow on hover. */
    interactive?: boolean;
};

export default function Card({
    tone = "cream",
    shadow = "ink",
    padding = "md",
    interactive = false,
    className,
    ...props
}: CardProps) {
    return (
        <div
            className={cn(
                "flex flex-col border-4 border-ink",
                tones[tone],
                shadows[shadow],
                paddings[padding],
                interactive && lift,
                className,
            )}
            {...props}
        />
    );
}
