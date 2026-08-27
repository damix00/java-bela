import MockLabel from "@/components/pages/table/blocks/shared/MockLabel";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/ui/cn";

type RankMeterProps = {
    copy: Dictionary["table"];
    /**
     * `compact` is the phone's version: one line, for a bar that is only as
     * tall as an avatar.
     */
    variant?: "full" | "compact";
    className?: string;
};

/**
 * Where you stand, in the top bar and nowhere else.
 *
 * Which, for now, is nowhere: there is no rating column, no ladder and no
 * season behind this app. What used to be here — a number, a band name, a
 * three-of-five progress bar and a countdown — was all invented in
 * `mock-data.ts`, and a rating is the one thing a card player will believe on
 * sight. So it says the true thing instead, and keeps the slot: the moment
 * ratings exist this is where they go, and the top bar's geometry doesn't have
 * to move to let them in.
 *
 * The bar went with the number rather than being drawn empty. A progress bar
 * with nothing behind it is the same claim as the number above it, only harder
 * to notice being wrong.
 */
export default function RankMeter({
    copy,
    variant = "full",
    className,
}: RankMeterProps) {
    if (variant === "compact") {
        return (
            <div className={cn("shrink-0 items-center gap-2", className)}>
                <MockLabel className="text-[10px] tracking-[.12em] text-ash">
                    {copy.unrated}
                </MockLabel>
            </div>
        );
    }

    return (
        <div className={cn("shrink-0 flex-col items-end gap-1", className)}>
            <strong className="font-display text-[16px] leading-none font-extrabold tracking-[-.03em] text-cream">
                {copy.unrated}
            </strong>
            <MockLabel className="text-[10px] tracking-[.12em] text-ash">
                {copy.unranked}
            </MockLabel>
        </div>
    );
}
