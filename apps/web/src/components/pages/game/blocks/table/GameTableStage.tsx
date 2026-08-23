import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import styles from "./GameTableStage.module.css";

type GameTableStageProps = {
    near: ReactNode;
    across: ReactNode;
    left: ReactNode;
    right: ReactNode;
    centre: ReactNode;
    className?: string;
};

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
    className,
}: GameTableStageProps) {
    return (
        <div
            data-game-stage=""
            className={cn(styles.stage, className)}
        >
            <div className={styles.across}>{across}</div>
            <div className={styles.left}>{left}</div>

            <div
                data-game-table=""
                className={cn(
                    styles.felt,
                    "overflow-hidden border-4 border-ink bg-baize-deep p-1.5 shadow-hard-lg sm:p-2 lg:p-[10px]",
                )}
            >
                <div
                    className={cn(
                        styles.feltInner,
                        "border-2 border-mint/20 bg-baize p-1.5 sm:p-4",
                    )}
                >
                    {centre}
                </div>
            </div>

            <div className={styles.right}>{right}</div>
            <div className={styles.near}>{near}</div>
        </div>
    );
}
