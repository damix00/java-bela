import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";

type GameTableStageProps = {
    near: ReactNode;
    across: ReactNode;
    left: ReactNode;
    right: ReactNode;
    centre: ReactNode;
    /**
     * A decision tray is open under the table, so there is less to go round and
     * the felt is allowed to give up more of it.
     */
    compact?: boolean;
    className?: string;
};

/* The table is three rows of a grid rather than absolutely placed chairs. The
   chairs used to float over the felt, which held together only while the play
   area happened to be tall enough — below that the across seat printed its name
   straight through the middle of the table. Rows cannot collide, and the felt
   simply takes whatever height is left over — on the desk layout too, where the
   chairs get a row of their own above and below it. */
const stageClass = [
    "relative grid h-full min-h-0 w-full max-w-180 mx-auto items-center justify-items-center gap-1",
    "grid-cols-[minmax(2.75rem,4rem)_minmax(0,1fr)_minmax(2.75rem,4rem)] grid-rows-[auto_minmax(0,1fr)]",
    "flat:gap-0.5 flat:grid-cols-[3rem_minmax(0,1fr)_3rem]",
    "desk:max-w-160 desk:items-stretch desk:justify-items-stretch desk:gap-[clamp(0.5rem,1.75vh,1rem)]",
    "desk:grid-cols-[5rem_minmax(0,1fr)_5rem] desk:grid-rows-[auto_minmax(0,1fr)_auto]",
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

/* Below the hand on phones, so it is not a chair at that size — and on a screen
   short enough that the decision has come off the felt, where the row it would
   sit in is worth more to the felt than to a name that is already under the
   hand. */
const nearClass = [
    "hidden col-span-full",
    "desk:flex desk:w-auto desk:row-start-3",
    "desk-lg:col-start-2 desk-lg:col-end-3",
    "felt-short:hidden",
].join(" ");

const sideClass =
    "z-[3] w-full row-start-2 desk:flex desk:self-center desk-lg:mx-auto desk-lg:max-w-44";

/* The cell is what the felt measures itself against: a square that fits the
   shorter of the two sides needs to know the height, and a grid track cannot be
   asked for it. */
const feltCellClass =
    "flex h-full min-h-0 w-full items-center justify-center [container-type:size] col-start-2 row-start-2";

/* A square that fits whichever side is shorter — a letterbox table reads as a
   bug, and a table taller than the room leaves the trick clipped. */
const feltClass = [
    "z-[1] aspect-square w-[max(5.5rem,min(100%,100cqh))]",
    "flat:w-[max(3.5rem,min(100%,100cqh))]",
    "overflow-hidden border-4 border-ink bg-baize-deep p-1.5 shadow-hard-lg sm:p-2 lg:p-[10px]",
].join(" ");

/* A size container: the trick pile sizes its cards against the felt itself, so
   they grow with the table instead of against a rem ladder that can outrun a
   small square and spill over the border. */
/* `sm:p-4` is measured against the width, and a felt that is short rather than
   narrow can spend more on padding than it has left for what sits inside it. */
const feltInnerClass = [
    "flex h-full min-h-0 w-full flex-col items-center justify-center gap-1.5 overflow-hidden [container-type:size]",
    "border-2 border-mint/20 bg-baize p-1.5 sm:p-4 desk:gap-3",
    "felt-short:p-2 flat:p-1 flat:gap-0.5",
].join(" ");

/**
 * The in-game table.
 *
 * Phones get an open, viewport-filling arrangement: opponents sit around the
 * felt without making their labels part of the felt's own grid. This leaves the
 * vertical space between the score and the hand useful instead of forcing every
 * phone into a small desktop diagram. Roomier screens return to the lobby's
 * familiar three-column table geometry.
 */
export default function GameTableStage({
    near,
    across,
    left,
    right,
    centre,
    compact = false,
    className,
}: GameTableStageProps) {
    return (
        <div data-game-stage="" className={cn(stageClass, className)}>
            <div className={acrossClass}>{across}</div>
            <div className={cn(sideClass, "col-start-1")}>{left}</div>

            <div className={feltCellClass}>
                <div
                    data-game-table=""
                    className={cn(
                        feltClass,
                        compact && "tray-room:w-[max(4rem,min(100%,100cqh))]",
                    )}
                >
                    <div className={feltInnerClass}>{centre}</div>
                </div>
            </div>

            <div className={cn(sideClass, "col-start-3")}>{right}</div>
            <div className={nearClass}>{near}</div>
        </div>
    );
}
