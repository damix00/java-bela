import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";
import { focusRing } from "@/lib/styles";

const tones = {
  white: "bg-white",
  cream: "bg-cream",
} as const;

type TextInputProps = Omit<ComponentProps<"input">, "id"> & {
  id: string;
  /** Always rendered for screen readers; `hideLabel` only hides it visually. */
  label: string;
  hideLabel?: boolean;
  tone?: keyof typeof tones;
};

export default function TextInput({
  id,
  label,
  hideLabel = false,
  tone = "white",
  type = "text",
  className,
  ...props
}: TextInputProps) {
  return (
    <>
      <label htmlFor={id} className={cn(hideLabel && "sr-only")}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={cn(
          focusRing,
          "w-full rounded-none border-4 border-ink px-5 py-4 font-sans text-[17px] text-ink outline-none",
          tones[tone],
          className,
        )}
        {...props}
      />
    </>
  );
}
