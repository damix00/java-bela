import type { ReactNode } from "react";

import { motion, useReducedMotion } from "motion/react";

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
    /** True while a seat switch is resolving — the felt dips and settles back. */
    settling?: boolean;
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
 * The wide arrangement waits for `lg`. With the marketing page's gutters these
 * routes have ~544px to work with at `md`, and three columns in that is
 * narrower per seat than the phone layout it would be replacing.
 *
 * Placement lives here and sizing lives on the children, which is what lets the
 * same grid hold a full `SeatCard` at the near edge and a 48px `SideSeat` in
 * the columns without either knowing where it has been put.
 */
export default function TableStage({
    near,
    across,
    left,
    right,
    centre,
    settling = false,
    className,
}: TableStageProps) {
    const reduceMotion = useReducedMotion();
    const feltTransition = reduceMotion
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 300, damping: 26 };

    return (
        <div
            className={cn(
                "mx-auto grid w-full max-w-[560px] grid-cols-[48px_minmax(0,1fr)_48px] items-stretch gap-2",
                "sm:grid-cols-[104px_minmax(0,1fr)_104px] sm:gap-4",
                "lg:max-w-[1000px] lg:grid-cols-[minmax(0,1fr)_320px_minmax(0,1fr)] lg:gap-6 xl:gap-8",
                className,
            )}
        >
            <div className="col-span-3 col-start-1 row-start-1 flex w-full lg:col-span-1 lg:col-start-2">
                {across}
            </div>

            <div className="col-start-1 row-start-2 flex aspect-square w-full self-center lg:mx-auto lg:max-w-[176px]">
                {left}
            </div>

            <motion.div
                data-game-table=""
                animate={{ scale: settling && !reduceMotion ? 0.985 : 1 }}
                transition={feltTransition}
                className="col-start-2 row-start-2 aspect-square w-full overflow-hidden border-4 border-ink bg-baize-deep p-1.5 shadow-hard-lg sm:p-2 lg:p-[10px]"
            >
                <div className="flex size-full min-h-0 flex-col items-center justify-center gap-1.5 overflow-hidden border-2 border-mint/20 bg-baize p-1.5 sm:gap-3 sm:p-4">
                    {centre}
                </div>
            </motion.div>

            <div className="col-start-3 row-start-2 flex aspect-square w-full self-center lg:mx-auto lg:max-w-[176px]">
                {right}
            </div>

            <div className="col-span-3 col-start-1 row-start-3 flex w-full lg:col-span-1 lg:col-start-2">
                {near}
            </div>
        </div>
    );
}
