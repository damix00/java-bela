import type { ComponentProps } from "react";

import { cn } from "@/lib/ui/cn";
import {
    feltInputBox,
    focusRing,
    inputBox,
    type Surface,
} from "@/lib/ui/styles";

const tones = {
    white: "bg-white",
    cream: "bg-cream",
} as const;

export type InputProps = ComponentProps<"input"> & {
    tone?: keyof typeof tones;
    surface?: Surface;
};

/**
 * Bare field, no label of its own — either `TextInput` or `Field` supplies
 * that. Split out so both labelling styles (a plain inline label, and the
 * stacked caps label of the auth screens) can share one field.
 */
/**
 * On the felt the field draws no frame and `tone` has nothing to choose
 * between: white and cream were the two lights a field could be on a cream
 * page, and out here there is one, the panel's own `baize-deep`.
 */
export default function Input({
    tone = "white",
    surface = "brut",
    type = "text",
    className,
    ...props
}: InputProps) {
    return (
        <input
            type={type}
            className={cn(
                focusRing,
                surface === "felt" ? feltInputBox : [inputBox, tones[tone]],
                className,
            )}
            {...props}
        />
    );
}
