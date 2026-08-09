import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const tones = {
  ink: "text-ink hover:text-ink",
  ash: "text-ash hover:text-cream",
} as const;

type TextLinkProps = ComponentProps<"a"> & {
  tone?: keyof typeof tones;
  weight?: "normal" | "semibold";
};

export default function TextLink({
  tone = "ink",
  weight = "normal",
  className,
  ...props
}: TextLinkProps) {
  return (
    <a
      className={cn(
        "text-[15px] no-underline hover:underline hover:decoration-[3px] hover:underline-offset-[5px]",
        tones[tone],
        weight === "semibold" && "font-semibold",
        className,
      )}
      {...props}
    />
  );
}
