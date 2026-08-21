import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";
import { pressLg } from "@/lib/styles";

const tones = {
    cream: "bg-cream",
    sage: "bg-sage",
    forest: "bg-forest",
    rust: "bg-rust",
    ink: "bg-ink",
} as const;

// A card casts one shadow colour at a time — two on the same block read as a
// mistake. Rust is the accent: it marks the one card in a set that the page is
// steering towards (create account, the code prompt, the welcome band).
const shadows = {
    none: "",
    ink: "shadow-hard-lg",
    rust: "shadow-hard-rust",
} as const;

const paddings = {
    none: "",
    md: "p-7",
    lg: "p-8",
} as const;

/** The two things a card is ever allowed to be. */
type CardElement = "div" | "button";

type CardProps<T extends CardElement> = {
    /**
     * `button` when the whole card is the control rather than a surface with
     * controls on it — a lobby seat you press to sit in, say. The props then
     * type as a button's, so `type="button"` and `disabled` are available and
     * `onClick` carries the right event.
     */
    as?: T;
    tone?: keyof typeof tones;
    shadow?: keyof typeof shadows;
    padding?: keyof typeof paddings;
    /** Takes the same press physics as `Button`. Needs a shadow to move against. */
    interactive?: boolean;
} & Omit<ComponentProps<T>, "as">;

export default function Card<T extends CardElement = "div">({
    as,
    tone = "cream",
    shadow = "ink",
    padding = "md",
    interactive = false,
    className,
    ...props
}: CardProps<T>) {
    // Narrowed at the call site by the generic; inside, the two branches share
    // every attribute this component sets, so one cast covers both.
    const Element = (as ?? "div") as "div";

    return (
        <Element
            className={cn(
                "flex flex-col border-4 border-ink",
                tones[tone],
                shadows[shadow],
                paddings[padding],
                interactive && shadow !== "none" && pressLg,
                className,
            )}
            {...(props as ComponentProps<"div">)}
        />
    );
}
