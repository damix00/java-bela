import type { ComponentProps } from "react";

import Chip from "@/components/ui/surfaces/Chip";
import { cn } from "@/lib/cn";
import { hatch } from "@/lib/styles";

const shadows = {
  none: "",
  rust: "shadow-hard-xl",
} as const;

type MediaPanelProps = Omit<ComponentProps<"div">, "children"> & {
  /** Stand-in copy shown until real artwork lands. */
  caption: string;
  shadow?: keyof typeof shadows;
  bordered?: boolean;
};

/** Hatched placeholder standing in for a screenshot. */
export default function MediaPanel({
  caption,
  shadow = "none",
  bordered = true,
  className,
  ...props
}: MediaPanelProps) {
  return (
    <div
      className={cn(
        hatch,
        "grid place-items-center",
        bordered && "border-4 border-ink",
        shadows[shadow],
        className,
      )}
      {...props}
    >
      <Chip>{caption}</Chip>
    </div>
  );
}
