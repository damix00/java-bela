import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const tones = {
  stone: "text-stone",
  forest: "text-forest",
  cream: "text-cream",
} as const;

// `ref` is dropped: the four tags this renders as have incompatible element
// types, and nothing needs a handle on the node.
type EyebrowProps = Omit<ComponentProps<"span">, "ref"> & {
  as?: "span" | "div" | "label" | "p";
  tone?: keyof typeof tones;
  /** Only meaningful with `as="label"`. */
  htmlFor?: string;
};

/**
 * The small monospaced caps label — field names, step counters, stat captions.
 * Set in mono so it reads as machine annotation next to the display type,
 * never as another voice in the copy.
 */
export default function Eyebrow({
  as: Tag = "span",
  tone = "stone",
  className,
  ...props
}: EyebrowProps) {
  return (
    <Tag
      className={cn(
        "font-mono text-[11px] font-semibold tracking-[.1em] uppercase",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
