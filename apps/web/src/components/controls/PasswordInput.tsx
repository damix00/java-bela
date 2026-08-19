"use client";

import { useState, type ComponentProps } from "react";

import { cn } from "@/lib/cn";
import { focusRing, inputBare, inputFrame } from "@/lib/styles";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = Omit<ComponentProps<"input">, "type"> & {
    id: string;
    /** Toggle copy — "show" / "hide", already localised. */
    showLabel: string;
    hideLabel: string;
    /** Goes on the wrapper; the input keeps the rest of the props. */
    className?: string;
};

/**
 * Password field with a reveal toggle welded to its right edge. The toggle is
 * inside the frame rather than beside it, so the pair keeps the silhouette of
 * a single field.
 *
 * Everything else is passed straight to the input, which is what lets
 * `{...register("password")}` land on it: the ref, the name and the change
 * handlers all have to reach the real control.
 */
export default function PasswordInput({
    id,
    showLabel,
    hideLabel,
    className,
    autoComplete = "current-password",
    ...props
}: PasswordInputProps) {
    const [revealed, setRevealed] = useState(false);

    return (
        <div className={cn(inputFrame, className)}>
            <input
                id={id}
                type={revealed ? "text" : "password"}
                autoComplete={autoComplete}
                className={inputBare}
                {...props}
            />
            <button
                type="button"
                // The state, not the action: a screen reader gets "show password" while
                // the field is masked, which is what the button will do next.
                aria-pressed={revealed}
                aria-label={revealed ? hideLabel : showLabel}
                onClick={() => setRevealed((current) => !current)}
                className={cn(
                    focusRing,
                    "cursor-pointer self-stretch border-l-4 border-ink bg-sage px-4 text-[11px] font-semibold tracking-[.08em] text-ink uppercase",
                )}
            >
                {revealed ? <EyeOff /> : <Eye />}
            </button>
        </div>
    );
}
