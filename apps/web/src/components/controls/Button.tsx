import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/ui/cn";
import { focusRing, hitAreaJoined, pressMd, pressSm } from "@/lib/ui/styles";

const tones = {
    rust: "bg-rust text-cream hover:text-cream",
    forest: "bg-forest text-cream hover:text-cream",
    ink: "bg-ink text-cream hover:text-cream",
    /** The quieter half of a pair — same block, no fill. */
    cream: "bg-cream text-ink hover:text-ink",
} as const;

const sizes = {
    sm: "border-[3px] px-5 py-[11px] text-[15px] shadow-hard-sm",
    md: "border-4 px-[26px] py-4 text-[16px] shadow-hard",
    lg: "border-4 px-[26px] py-4 text-[17px] shadow-hard",
} as const;

// Keyed to the resting shadow each size drops, since travel is derived from it.
const presses = {
    sm: pressSm,
    md: pressMd,
    lg: pressMd,
} as const;

type ButtonVariants = {
    tone?: keyof typeof tones;
    size?: keyof typeof sizes;
    /**
     * Welded into a larger block — the wrapper carries the hard shadow and the
     * press physics for the whole thing, so input and button move as one.
     */
    joined?: boolean;
    /**
     * The same block with the neo-brutalism taken off: rounded, no ink frame,
     * no offset shadow, and a press that dips rather than slides. For the game
     * table, which is a table rather than a poster and where a row of hard
     * blocks reads as furniture from another screen.
     */
    soft?: boolean;
};

// The press is subtractive: `soft` has to undo the border width and the shadow
// that `sizes[size]` brings with it, so it is appended after them.
const softShape =
    "rounded-full border-0 shadow-none transition-transform duration-100 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100";

function buttonClass({
    tone = "rust",
    size = "md",
    joined,
    soft,
}: ButtonVariants) {
    return cn(
        soft ? null : joined ? hitAreaJoined : presses[size],
        focusRing,
        "disabled:pointer-events-none disabled:opacity-60",
        "inline-block rounded-none border-ink font-display font-extrabold no-underline select-none",
        tones[tone],
        sizes[size],
        // After `sizes`, which is where the shadow it drops comes from.
        joined && "shadow-none",
        soft && softShape,
    );
}

export function Button({
    tone,
    size,
    joined,
    soft,
    type = "button",
    className,
    ...props
}: ComponentProps<"button"> & ButtonVariants) {
    return (
        <button
            type={type}
            className={cn(
                "cursor-pointer",
                buttonClass({ tone, size, joined, soft }),
                className,
            )}
            {...props}
        />
    );
}

/** Same block, rendered as a link — for CTAs that navigate. */
export function ButtonLink({
    tone,
    size,
    joined,
    soft,
    className,
    ...props
}: ComponentProps<typeof Link> & ButtonVariants) {
    return (
        <Link
            className={cn(buttonClass({ tone, size, joined, soft }), className)}
            {...props}
        />
    );
}
