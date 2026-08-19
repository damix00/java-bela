import type { ComponentProps, ReactNode } from "react";

import Card from "@/components/ui/surfaces/Card";
import { cn } from "@/lib/cn";

const asideTones = {
    forest: "bg-forest",
    sage: "bg-sage",
} as const;

type AuthSplitProps = {
    /** The promotional half: the pitch, the perks, the preview. */
    aside: ReactNode;
    /** Which side the aside takes from `lg` up. */
    asideSide?: "left" | "right";
    asideTone?: keyof typeof asideTones;
    /**
     * `between` pins the aside's first child to the top — the sign-in panel,
     * where the logo sits in the corner. `center` is for a panel that is one
     * block of content.
     */
    asideAlign?: "between" | "center";
    /**
     * Where the aside lands once the panels stack. A pitch belongs above the
     * form it is selling (`asideFirst`); a preview of what the form produces
     * belongs under it (`asideLast`).
     */
    stackOrder?: "asideFirst" | "asideLast";
    /** Column template from `lg` up — the halves are rarely even. */
    columns?: string;
    shadow?: ComponentProps<typeof Card>["shadow"];
    /** The form half. */
    children: ReactNode;
};

/**
 * The two-panel auth card: a form on one side, the reason to fill it in on the
 * other.
 *
 * The aside is always first in the DOM, whichever side it ends up on, and
 * `stackOrder` decides where it lands once the panels stack on a phone. The
 * dividing rule follows: the panels are ruled off from each other, and the
 * rule turns from horizontal to vertical when they line up side by side.
 */
export default function AuthSplit({
    aside,
    asideSide = "left",
    asideTone = "forest",
    asideAlign = "between",
    stackOrder = "asideFirst",
    columns = "lg:grid-cols-[45%_55%]",
    shadow = "ink",
    children,
}: AuthSplitProps) {
    return (
        <Card
            padding="none"
            shadow={shadow}
            className={cn("w-full lg:grid lg:min-h-[600px]", columns)}
        >
            <div
                className={cn(
                    "flex flex-col gap-8 border-ink p-8 sm:p-10 lg:px-10 lg:py-11",
                    stackOrder === "asideFirst"
                        ? "border-b-4 lg:border-b-0"
                        : "order-last border-t-4 lg:border-t-0",
                    asideAlign === "between"
                        ? "justify-between"
                        : "justify-center",
                    asideTones[asideTone],
                    asideSide === "left"
                        ? "lg:order-first lg:border-r-4"
                        : "lg:order-2 lg:border-l-4",
                )}
            >
                {aside}
            </div>
            <div className="flex flex-col justify-center gap-[22px] p-8 sm:p-10 lg:px-14 lg:py-13">
                {children}
            </div>
        </Card>
    );
}
