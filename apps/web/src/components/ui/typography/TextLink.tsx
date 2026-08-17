import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const tones = {
  ink: "text-ink hover:text-ink",
  ash: "text-ash hover:text-cream",
} as const;

type TextLinkProps = ComponentProps<typeof Link> & {
  tone?: keyof typeof tones;
  weight?: "normal" | "semibold";
};

/**
 * Routed link: the auth screens navigate between real pages, so every one of
 * these goes through the router. In-page anchors work through it unchanged.
 */
export default function TextLink({
  tone = "ink",
  weight = "normal",
  className,
  ...props
}: TextLinkProps) {
  return (
    <Link
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
