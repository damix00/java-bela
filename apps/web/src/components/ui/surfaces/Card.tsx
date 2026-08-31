import type { ComponentProps } from "react";

import { cn } from "@/lib/ui/cn";
import { dip, panel, pressLg, type Surface } from "@/lib/ui/styles";

const tones = {
    cream: "bg-cream",
    sage: "bg-sage",
    forest: "bg-forest",
    rust: "bg-rust",
    ink: "bg-ink",
} as const;

/**
 * The same five names on the felt.
 *
 * `cream` and `sage` both land on `baize-deep`, which is not a loss of two
 * tones for one: on the cream page they were the two light neutrals a card
 * could be, and the rule they existed to keep — a block never repeats the
 * colour of the surface under it — is kept on the felt by the single step down
 * from `baize`. `forest` stays itself, because the auth split still needs its
 * two halves told apart, and it is the one colour that reads as a *different*
 * block rather than a lighter one.
 */
const feltTones = {
    cream: "bg-baize-deep",
    sage: "bg-baize-deep",
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

/**
 * The accent survives the move to the felt, but not as a shadow: a soft shadow
 * has no colour to read at this blur, and a hard rust one out here would be the
 * only sharp edge on the screen. It becomes a ring instead — the same "this is
 * the card you want" mark, said the way the felt says everything else.
 */
const feltAccents = {
    none: "shadow-none",
    ink: "",
    rust: "ring-2 ring-rust/40",
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
    surface?: Surface;
    tone?: keyof typeof tones;
    shadow?: keyof typeof shadows;
    padding?: keyof typeof paddings;
    /** Takes the same press physics as `Button`. Needs a shadow to move against. */
    interactive?: boolean;
} & Omit<ComponentProps<T>, "as">;

export default function Card<T extends CardElement = "div">({
    as,
    surface = "brut",
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
    const felt = surface === "felt";

    return (
        <Element
            className={cn(
                "flex flex-col",
                felt
                    ? [panel, feltTones[tone], feltAccents[shadow]]
                    : ["border-4 border-ink", tones[tone], shadows[shadow]],
                paddings[padding],
                interactive && (felt ? dip : shadow !== "none" && pressLg),
                className,
            )}
            {...(props as ComponentProps<"div">)}
        />
    );
}
