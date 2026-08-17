import type { ComponentProps } from "react";

import Card from "@/components/ui/surfaces/Card";
import { cn } from "@/lib/cn";

/**
 * The single-column auth card — password reset, the code prompt, the states
 * that ask one thing. Narrow on purpose: nothing on these screens deserves a
 * second column.
 */
export default function AuthCard({
  className,
  ...props
}: ComponentProps<typeof Card>) {
  return (
    <Card
      padding="none"
      className={cn("gap-5 p-8 sm:p-10 lg:p-11", className)}
      {...props}
    />
  );
}
