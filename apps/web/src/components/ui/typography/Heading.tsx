import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const sizes = {
    /** Page-opening headline. */
    hero: "text-[40px] leading-[1.12] tracking-[-.04em] sm:text-[56px] lg:text-[72px]",
    /** Short, loud statement — closing CTA. */
    statement:
        "text-[44px] leading-[1.05] tracking-[-.04em] sm:text-[54px] lg:text-[62px]",
    /** Standard section heading. */
    section:
        "text-[34px] leading-[1.08] tracking-[-.035em] sm:text-[42px] lg:text-[50px]",
    /** Section-scale heading living inside a card, so it stops growing sooner. */
    cardHero: "text-[34px] leading-[1.06] tracking-[-.035em] sm:text-[42px]",
    card: "text-[27px] leading-[1.15] tracking-[-.03em]",
    subhead: "text-[24px] leading-[1.2] tracking-[-.03em]",
    label: "text-[20px] leading-[1.25] tracking-[-.02em]",
} as const;

const tones = {
    ink: "text-ink",
    cream: "text-cream",
    rust: "text-rust",
} as const;

type HeadingProps = ComponentProps<"h2"> & {
    /** Rendered element — pick for document outline, `size` for looks. */
    as?: "h1" | "h2" | "h3" | "h4" | "p";
    size?: keyof typeof sizes;
    tone?: keyof typeof tones;
};

export default function Heading({
    as: Tag = "h2",
    size = "section",
    tone = "ink",
    className,
    ...props
}: HeadingProps) {
    return (
        <Tag
            className={cn(
                "m-0 font-display font-extrabold text-balance",
                sizes[size],
                tones[tone],
                className,
            )}
            {...props}
        />
    );
}
