"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";
import { focusRing, inputBare, inputFrame } from "@/lib/styles";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = {
    id: string;
    /** Toggle copy — "show" / "hide", already localised. */
    showLabel: string;
    hideLabel: string;
    defaultValue?: string;
    placeholder?: string;
    autoComplete?: string;
    className?: string;
};

/**
 * Password field with a reveal toggle welded to its right edge. The toggle is
 * inside the frame rather than beside it, so the pair keeps the silhouette of
 * a single field.
 */
export default function PasswordInput({
    id,
    showLabel,
    hideLabel,
    defaultValue,
    placeholder,
    autoComplete = "current-password",
    className,
}: PasswordInputProps) {
    const [revealed, setRevealed] = useState(false);

    return (
        <div className={cn(inputFrame, className)}>
            <input
                minLength={8}
                id={id}
                type={revealed ? "text" : "password"}
                defaultValue={defaultValue}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className={inputBare}
            />
            <button
                type="button"
                // The state, not the action: a screen reader gets "show password" while
                // the field is masked, which is what the button will do next.
                aria-pressed={revealed}
                onClick={() => setRevealed((current) => !current)}
                className={cn(
                    focusRing,
                    "cursor-pointer self-stretch border-l-4 border-ink bg-sage px-4 font-mono text-[11px] font-semibold tracking-[.08em] text-ink uppercase",
                )}>
                {revealed ? <EyeOff /> : <Eye />}
            </button>
        </div>
    );
}
