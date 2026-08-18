"use client";

import { useRef, type KeyboardEvent } from "react";

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

  function setDigit(index: number, typed: string) {
    // Last character wins, so typing over a filled box replaces it rather than
    // being rejected by `maxLength`.
    const digit = typed.replace(/\D/g, "").slice(-1);
    const next = digits.slice();
    next[index] = digit;

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
    if (digit) boxes.current[index + 1]?.focus();
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
            <span aria-hidden className="h-1 w-3.5 shrink-0 bg-ink" />
          )}
          <input
            ref={(element) => {
              boxes.current[index] = element;
            }}
            value={digit}
            onChange={(event) => setDigit(index, event.target.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
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
