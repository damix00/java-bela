import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";
import { focusRing, lift } from "@/lib/styles";

const tones = {
  rust: "bg-rust text-cream hover:text-cream",
  forest: "bg-forest text-cream hover:text-cream",
  ink: "bg-ink text-cream hover:text-cream",
} as const;

const sizes = {
  sm: "border-[3px] px-5 py-[11px] text-[15px] shadow-hard-sm",
  md: "border-4 px-[26px] py-4 text-[16px] shadow-hard",
  lg: "border-4 px-[26px] py-4 text-[17px] shadow-hard",
} as const;

type ButtonVariants = {
  tone?: keyof typeof tones;
  size?: keyof typeof sizes;
};

function buttonClass({ tone = "rust", size = "md" }: ButtonVariants) {
  return cn(
    lift,
    focusRing,
    "inline-block rounded-none border-ink font-display font-extrabold no-underline",
    tones[tone],
    sizes[size],
  );
}

export function Button({
  tone,
  size,
  type = "button",
  className,
  ...props
}: ComponentProps<"button"> & ButtonVariants) {
  return (
    <button
      type={type}
      className={cn("cursor-pointer", buttonClass({ tone, size }), className)}
      {...props}
    />
  );
}

/** Same block, rendered as an anchor — for CTAs that navigate. */
export function ButtonLink({
  tone,
  size,
  className,
  ...props
}: ComponentProps<"a"> & ButtonVariants) {
  return (
    <a className={cn(buttonClass({ tone, size }), className)} {...props} />
  );
}
