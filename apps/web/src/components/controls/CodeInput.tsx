"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

import { cn } from "@/lib/cn";
import { focusRing } from "@/lib/styles";

type CodeInputProps = {
    /** The digits typed so far, shorter than `length` while incomplete. */
    value: string;
    onChange: (code: string) => void;
    onBlur?: () => void;
    length?: number;
    /** Names each box for screen readers: "Digit 1", "Digit 2"… */
    digitLabel: string;
    invalid?: boolean;
    /** Error line to point at, when there is one. */
    describedBy?: string;
    className?: string;
};

/**
 * One box per digit, splitting after the third — the same grouping the codes
 * are read out in. Typing carries the caret forward and backspacing on an
 * empty box carries it back, so the six boxes behave like one field.
 *
 * The code is held as one string by the form rather than as state in here:
 * six boxes are a presentation of one value, and validation has to see the
 * value whole.
 */
export default function CodeInput({
    value,
    onChange,
    onBlur,
    length = 6,
    digitLabel,
    invalid = false,
    describedBy,
    className,
}: CodeInputProps) {
    const boxes = useRef<(HTMLInputElement | null)[]>([]);
    // A held-open gap reads back as an empty box, not as a box holding a space.
    const digits = Array.from({ length }, (_, index) =>
        (value[index] ?? "").trim(),
    );

    /**
     * Writes `typed` into the boxes from `index` on, and leaves the caret in
     * the box after the last one written. One digit is the typing case; more
     * than one is a paste, which fills forward from wherever it landed.
     */
    function fillFrom(index: number, typed: string) {
        const incoming = typed.replace(/\D/g, "").slice(0, length - index);
        const next = digits.slice();
        // Typing over a filled box replaces it: with one digit in hand this is
        // the overwrite `maxLength` would otherwise refuse.
        for (let offset = 0; offset < incoming.length; offset += 1) {
            next[index + offset] = incoming[offset];
        }

        // A skipped box is held open with a space rather than closed up, so a code
        // typed out of order stays in the boxes it was typed into — and stays
        // invalid, since a space is not a digit. Trailing gaps are dropped, which
        // is what makes a half-typed code simply short.
        onChange(
            next
                .map((entry) => entry || " ")
                .join("")
                .trimEnd(),
        );
        if (incoming.length) {
            const landed = index + incoming.length;
            boxes.current[Math.min(landed, length - 1)]?.focus();
        }
    }

    /**
     * `maxLength` clips a pasted code down to its first character, which is the
     * one thing nobody pastes a code to get. Taking the clipboard directly is
     * the only way to see the whole of it.
     */
    function onPaste(event: ClipboardEvent<HTMLInputElement>, index: number) {
        const pasted = event.clipboardData.getData("text");
        if (!pasted) return;

        event.preventDefault();
        // A code pasted whole belongs in the whole field, not from the box that
        // happened to have focus — that is what a full-length paste means.
        const digitsPasted = pasted.replace(/\D/g, "");
        fillFrom(digitsPasted.length >= length ? 0 : index, digitsPasted);
    }

    /**
     * Typed input, one box at a time. `maxLength` usually refuses a keystroke on
     * a filled box outright, but where the browser lets the character through
     * the box holds two: the digit already there and the new one, and it is the
     * new one the player meant.
     */
    function onType(index: number, raw: string) {
        const typed =
            raw.length > 1 && raw.startsWith(digits[index])
                ? raw.slice(1)
                : raw;
        fillFrom(index, typed);
    }

    function onKeyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
        if (event.key === "Backspace" && !digits[index]) {
            boxes.current[index - 1]?.focus();
        }
    }

    return (
        <div className={cn("flex items-center gap-2 sm:gap-3", className)}>
            {digits.map((digit, index) => (
                <div key={index} className="contents">
                    {index === length / 2 && (
                        <span
                            aria-hidden
                            className="h-1 w-3.5 shrink-0 bg-ink"
                        />
                    )}
                    <input
                        ref={(element) => {
                            boxes.current[index] = element;
                        }}
                        value={digit}
                        onChange={(event) => onType(index, event.target.value)}
                        onKeyDown={(event) => onKeyDown(event, index)}
                        onPaste={(event) => onPaste(event, index)}
                        onBlur={onBlur}
                        aria-label={`${digitLabel} ${index + 1}`}
                        // The six boxes are one field, so they carry one verdict between
                        // them — flagging a single box would point at the wrong thing.
                        aria-invalid={invalid || undefined}
                        aria-describedby={describedBy}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        className={cn(
                            focusRing,
                            "w-full min-w-0 rounded-none border-4 border-ink bg-white py-3 text-center font-display text-[26px] font-extrabold text-ink outline-none aria-invalid:border-rust sm:w-[60px] sm:py-[14px] sm:text-[30px]",
                        )}
                    />
                </div>
            ))}
        </div>
    );
}
