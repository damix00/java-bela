"use client";

import { useRef, useState, type KeyboardEvent } from "react";

import { cn } from "@/lib/cn";
import { focusRing } from "@/lib/styles";

type CodeInputProps = {
  /** Digits per box, one entry each. Its length is the code length. */
  defaultValue?: string[];
  /** Names each box for screen readers: "Digit 1", "Digit 2"… */
  digitLabel: string;
  className?: string;
};

const DEFAULT_CODE = ["", "", "", "", "", ""];

/**
 * One box per digit, splitting after the third — the same grouping the codes
 * are read out in. Typing carries the caret forward and backspacing on an
 * empty box carries it back, so the six boxes behave like one field.
 */
export default function CodeInput({
  defaultValue = DEFAULT_CODE,
  digitLabel,
  className,
}: CodeInputProps) {
  const [code, setCode] = useState(defaultValue);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(index: number, value: string) {
    const next = code.slice();
    // Last character wins, so typing over a filled box replaces it rather than
    // being rejected by `maxLength`.
    next[index] = value.replace(/\D/g, "").slice(-1);
    setCode(next);
    if (next[index]) boxes.current[index + 1]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key === "Backspace" && !code[index]) {
      boxes.current[index - 1]?.focus();
    }
  }

  return (
    <div className={cn("flex items-center gap-2 sm:gap-3", className)}>
      {code.map((digit, index) => (
        <div key={index} className="contents">
          {index === code.length / 2 && (
            <span aria-hidden className="h-1 w-3.5 shrink-0 bg-ink" />
          )}
          <input
            ref={(element) => {
              boxes.current[index] = element;
            }}
            value={digit}
            onChange={(event) => setDigit(index, event.target.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            aria-label={`${digitLabel} ${index + 1}`}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            className={cn(
              focusRing,
              "w-full min-w-0 rounded-none border-4 border-ink bg-white py-3 text-center font-display text-[26px] font-extrabold text-ink outline-none sm:w-[60px] sm:py-[14px] sm:text-[30px]",
            )}
          />
        </div>
      ))}
    </div>
  );
}
