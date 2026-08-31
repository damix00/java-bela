import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

type GameTableStageProps = {
    across: ReactNode;
    left: ReactNode;
    right: ReactNode;
    centre: ReactNode;
    className?: string;
};

/* The table is two rows of a grid rather than absolutely placed chairs. The
   chairs used to float over the felt, which held together only while the play
   area happened to be tall enough — below that the across seat printed its name
   straight through the middle of the table. Rows cannot collide, and the felt
   simply takes whatever height is left over.

   There are three chairs, not four: your own seat is not drawn. You already
   know where you are sitting, and the row it used to take under the felt is
   worth more to the cards. */
const stageClass = [
    "relative grid h-full min-h-0 w-full max-w-180 mx-auto items-center justify-items-center gap-1",
    "grid-cols-[minmax(2.75rem,4rem)_minmax(0,1fr)_minmax(2.75rem,4rem)] grid-rows-[auto_minmax(0,1fr)]",
    "flat:gap-0.5 flat:grid-cols-[3rem_minmax(0,1fr)_3rem]",
    "desk:max-w-160 desk:items-stretch desk:justify-items-stretch desk:gap-[clamp(0.5rem,1.75vh,1rem)]",
    "desk:grid-cols-[5rem_minmax(0,1fr)_5rem]",
    "desk-lg:max-w-250 desk-lg:gap-[clamp(0.5rem,2.25vh,1.5rem)] desk-lg:grid-cols-[minmax(0,1fr)_24rem_minmax(0,1fr)]",
    "desk-xl:gap-[clamp(0.5rem,2.5vh,2rem)]",
].join(" ");

/* The far chair spans the whole width on a phone and on the roomy three-column
   table; only the widest layout narrows it onto the middle column. */
const acrossClass = [
    "z-[3] w-[min(100%,18rem)] col-span-full row-start-1",
    "flat:w-[min(100%,13rem)]",
    "desk:flex desk:w-auto",
    "desk-lg:col-start-2 desk-lg:col-end-3",
].join(" ");

const sideClass =
    "z-[3] w-full row-start-2 desk:flex desk:self-center desk-lg:mx-auto desk-lg:max-w-44";

/* The middle of the table, which is no longer a drawn object.
 *
 * There used to be a felt square here — a rounded rim around a lighter inner
 * surface — and everything in the centre was laid inside it. It is gone: the
 * whole screen is already felt, so a second felt panel on top of it was a box
 * around nothing, and it cost the trick the room its own border took.
 *
 * What the box did carry, and what this keeps, is the size container. The trick
 * pile measures `--trick-card` in `cqw`/`cqh`, so the cards grow with whatever
 * space the middle has rather than against a rem ladder that a short screen
 * would outrun. `overflow-hidden` stays with it for the same reason. */
const centreClass = [
    "flex h-full min-h-0 w-full flex-col items-center justify-center gap-1.5 overflow-hidden [container-type:size]",
    "col-start-2 row-start-2 p-1.5 sm:p-4 desk:gap-3",
    "felt-short:p-2 flat:p-1 flat:gap-0.5",
].join(" ");

/**
 * The in-game table.
 *
 * Three chairs around an open middle — your own seat is not drawn, and neither
 * is the table. What is left is the arrangement: opponents around the trick,
 * with the whole page's felt showing between them.
 */
export default function GameTableStage({
    across,
    left,
    right,
    centre,
    className,
}: GameTableStageProps) {
    return (
        <div data-game-stage="" className={cn(stageClass, className)}>
            <div className={acrossClass}>{across}</div>
            <div className={cn(sideClass, "col-start-1")}>{left}</div>

            <div data-game-table="" className={centreClass}>
                {centre}
            </div>

            <div className={cn(sideClass, "col-start-3")}>{right}</div>
        </div>
    );
}
