import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";
import { focusRing, inputBox } from "@/lib/styles";

const tones = {
    white: "bg-white",
    cream: "bg-cream",
} as const;

export type InputProps = ComponentProps<"input"> & {
    tone?: keyof typeof tones;
};

/**
 * Bare field, no label of its own — either `TextInput` or `Field` supplies
 * that. Split out so both labelling styles (a plain inline label, and the
 * stacked caps label of the auth screens) can share one field.
 */
export default function Input({
    tone = "white",
    type = "text",
    className,
    ...props
}: InputProps) {
    return (
        <input
            type={type}
            className={cn(focusRing, inputBox, tones[tone], className)}
            {...props}
        />
    );
}
