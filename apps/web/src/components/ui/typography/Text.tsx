import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const sizes = {
    xl: "text-[21px] leading-[1.6]",
    lg: "text-[19px] leading-[1.6]",
    md: "text-[17px] leading-[1.55]",
    sm: "text-[16px] leading-[1.55]",
    xs: "text-[15px] leading-[1.5]",
} as const;

const tones = {
    ink: "text-ink",
    /** Default body copy on light surfaces. */
    muted: "text-moss",
    cream: "text-cream",
    /** Body copy on forest. */
    mint: "text-mint",
    mintSoft: "text-mint-soft",
    /** Body copy on ink. */
    ash: "text-ash",
    /** Body copy on rust. */
    ember: "text-ember",
} as const;

type TextProps = ComponentProps<"p"> & {
    as?: "p" | "span" | "div";
    size?: keyof typeof sizes;
    tone?: keyof typeof tones;
    weight?: "normal" | "medium";
};

export default function Text({
    as: Tag = "p",
    size = "sm",
    tone = "muted",
    weight = "normal",
    className,
    ...props
}: TextProps) {
    return (
        <Tag
            className={cn(
                "m-0",
                sizes[size],
                tones[tone],
                weight === "medium" && "font-medium",
                className,
            )}
            {...props}
        />
    );
}
