import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

/**
 * One seat, at every position on the table.
 *
 * The side columns are this wide and the near and across seats are cut to
 * match, so all four are the same square — which is what keeps a seat change
 * from resizing anything. 88px is the floor rather than the ideal: it is the
 * width at which an avatar, a name and a role still fit, and the felt gives it
 * up because the felt only holds an ornament and two short lines.
 */
const seatSquare = "aspect-square w-[88px] desk:w-[104px] desk-lg:w-[120px]";

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
 * every width: the seats narrow with the screen rather than dropping out, so
 * the shape of what is being joined survives down to 360px.
 *
 * All four are the same square. The near and across seats used to be
 * full-width cards, which meant a player changing teams moved between two
 * different shapes and left a row behind that resized to whatever the empty
 * chair happened to be — the felt and the band under it jumped on every press.
 * Equal squares have nothing to resize, and they are the truer picture of the
 * table besides: four seats of the same standing, none of them the main one.
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
 *
 * The one thing the grid does insist on is the height of the near and across
 * rows, which is pinned rather than taken from whoever is sitting there. A row
 * used to be as tall as its contents, and a taken seat and an empty chair are
 * not the same height — so changing teams, which empties one row slot and fills
 * another, resized two of the three grid rows and slid the felt and everything
 * under it. The rows are held at the seat card's own height instead: the card
 * fills it exactly, the empty chair takes its square from it, and a swap moves
 * players without moving the table.
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
                // Every track is stated at this width rather than shared out:
                // a flexed side column lands wherever the container leaves it
                // (160px at 1280), and a seat that is 16px short of the one
                // across from it is not the same seat. Fixed tracks, centred as
                // a block, keep the four squares identical.
                "desk-lg:grid-cols-[120px_280px_120px] desk-lg:justify-center desk-lg:gap-6",
                className,
            )}
        >
            <div
                className={cn(
                    "col-start-2 row-start-1 mx-auto flex",
                    seatSquare,
                )}
            >
                {across}
            </div>

            <div
                className={cn(
                    "col-start-1 row-start-2 mx-auto flex self-center",
                    seatSquare,
                )}
            >
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

            <div
                className={cn(
                    "col-start-3 row-start-2 mx-auto flex self-center",
                    seatSquare,
                )}
            >
                {right}
            </div>

            <div
                className={cn(
                    "col-start-2 row-start-3 mx-auto flex",
                    seatSquare,
                )}
            >
                {near}
            </div>
        </div>
    );
}
