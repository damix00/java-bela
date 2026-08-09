import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/** Bordered box that rules off each child from the next. */
export default function DividedPanel({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col border-4 border-ink [&>*+*]:border-t-4 [&>*+*]:border-ink",
        className,
      )}
      {...props}
    />
  );
}
