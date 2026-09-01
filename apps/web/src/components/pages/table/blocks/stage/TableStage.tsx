import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

type TableStageProps = {
    /** The reader's own chair, at the near edge. */
    near: ReactNode;
    /** Their partner, opposite them. */
    across: ReactNode;
    /** The opposing pair, either side of the felt. */
    left: ReactNode;
    right: ReactNode;
    /** What sits on the felt between them. */
    centre: ReactNode;
    className?: string;
};

/**
 * The table itself: four seats around a piece of felt.
 *
 * The seats are laid out as the table is — partner across, the two opposing
 * seats to either side, you at the near edge. The same arrangement holds at
 * every width: the side seats narrow to their squares on a phone rather than
 * dropping out, so the shape of what is being joined survives down to 360px.
 *
 * The side columns are 88px on a phone rather than the 48px they used to be,
 * because 48px is not a seat. A seat is an avatar with a name under it, and at
 * 48px there was room for neither — the tile burst its own box and the name was
 * hidden outright, which left half the table anonymous on the screen most of
 * these games are played on. 88px is the width at which both fit; the felt
 * gives it up, and the felt only holds an ornament and two short lines.
 *
 * The steps are `desk`, not `sm`: a phone held sideways has width to spare and
 * no height at all, and the roomier arrangement is taller, not just wider. This
 * is the same reason the game screen sizes itself against both axes.
 *
 * Placement lives here and sizing lives on the children, which is what lets the
 * same grid hold a full `SeatCard` at the near edge and a square `SideSeat` in
 * the columns without either knowing where it has been put.
 */
export default function TableStage({
    near,
    across,
    left,
    right,
    centre,
    className,
}: TableStageProps) {
    return (
        <div
            className={cn(
                "mx-auto grid w-full max-w-[560px] grid-cols-[88px_minmax(0,1fr)_88px] items-stretch gap-2",
                // A phone laid flat has width to spare and none of the height
                // the felt spends it on: uncapped, the middle column takes the
                // full 560px and the square it makes is taller than the screen.
                "flat:max-w-[380px]",
                "desk:grid-cols-[104px_minmax(0,1fr)_104px] desk:gap-4",
                "desk-lg:max-w-[1000px] desk-lg:grid-cols-[minmax(0,1fr)_320px_minmax(0,1fr)] desk-lg:gap-6 desk-xl:gap-8",
                className,
            )}
        >
            <div className="col-span-3 col-start-1 row-start-1 flex w-full desk-lg:col-span-1 desk-lg:col-start-2">
                {across}
            </div>

            <div className="col-start-1 row-start-2 flex aspect-square w-full self-center desk-lg:mx-auto desk-lg:max-w-[176px]">
                {left}
            </div>

            <div
                data-game-table=""
                className="col-start-2 row-start-2 aspect-[6/5] w-full overflow-hidden rounded-2xl bg-baize-deep p-1.5 shadow-[0_6px_20px_-8px_rgb(0_0_0_/_0.5)] portrait-sm:aspect-[5/3] desk:aspect-square desk:p-2 desk-lg:p-[10px]"
            >
                {/* The playing surface, as a well sunk into the block around
                    it rather than a box drawn on it. The mint frame that used
                    to do this job was the last hard rectangle on the table —
                    square corners inside a rounded panel, which is exactly the
                    thing this screen no longer says anywhere else. The step
                    from `baize-deep` to `baize` is already the edge; an inset
                    shadow along the top is what makes it read as depth rather
                    than as a lighter patch.

                    The radius is the stage's own minus its padding, per the
                    concentric-corner rule in `lib/ui/styles` — and it has to
                    step wherever that padding does: 16−6, 16−8, 16−10. */}
                <div className="flex size-full min-h-0 flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[10px] bg-baize p-1.5 shadow-[inset_0_2px_10px_-4px_rgb(0_0_0_/_0.45)] desk:gap-3 desk:rounded-lg desk:p-4 desk-lg:rounded-md">
                    {centre}
                </div>
            </div>

            <div className="col-start-3 row-start-2 flex aspect-square w-full self-center desk-lg:mx-auto desk-lg:max-w-[176px]">
                {right}
            </div>

            <div className="col-span-3 col-start-1 row-start-3 flex w-full desk-lg:col-span-1 desk-lg:col-start-2">
                {near}
            </div>
        </div>
    );
}
