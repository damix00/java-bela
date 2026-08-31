import type { ComponentProps } from "react";

import { cn } from "@/lib/ui/cn";
import type { Surface } from "@/lib/ui/styles";

const tones = {
    stone: "text-stone",
    forest: "text-forest",
    cream: "text-cream",
    /** The felt's annotation: quieter than the copy beside it, still legible. */
    mint: "text-mint/80",
} as const;

// `ref` is dropped: the four tags this renders as have incompatible element
// types, and nothing needs a handle on the node.
type EyebrowProps = Omit<ComponentProps<"span">, "ref"> & {
    as?: "span" | "div" | "label" | "p";
    tone?: keyof typeof tones;
    /** Default tone for the surface: `stone` on cream, `mint` on the felt. */
    surface?: Surface;
    /** Only meaningful with `as="label"`. */
    htmlFor?: string;
};

/**
 * The small caps label — field names, step counters, stat captions.
 * Tracked-out uppercase so it reads as machine annotation next to the display
 * type, never as another voice in the copy.
 */
export default function Eyebrow({
    as: Tag = "span",
    surface = "brut",
    tone = surface === "felt" ? "mint" : "stone",
    className,
    ...props
}: EyebrowProps) {
    return (
        <Tag
            className={cn(
                "text-[11px] font-semibold tracking-[.1em] uppercase",
                tones[tone],
                className,
            )}
            {...props}
        />
    );
}
