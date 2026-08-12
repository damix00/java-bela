import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const tones = {
  cream: "",
  sage: "bg-sage",
  forest: "bg-forest",
} as const;

type SectionProps = ComponentProps<"section"> & {
  tone?: keyof typeof tones;
  /** Full-bleed sections (split panels) opt out of the standard gutters. */
  padded?: boolean;
  /** Every band but the last one is closed by a rule. */
  divided?: boolean;
};

export default function Section({
  tone = "cream",
  padded = true,
  divided = true,
  id,
  className,
  ...props
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        tones[tone],
        padded && "px-8 py-16 md:px-28 md:py-20 lg:px-48 xl:px-72",
        divided && "border-b-4 border-ink",
        // Anchored sections must clear the sticky header.
        id && "scroll-mt-24",
        className,
      )}
      {...props}
    />
  );
}
