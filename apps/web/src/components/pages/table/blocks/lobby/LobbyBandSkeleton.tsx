"use client";

import { motion, useReducedMotion } from "motion/react";

type LobbyBandSkeletonProps = {
    /** Announced while the placeholder is up — the line the band replaces. */
    label: string;
};

/**
 * The band's silhouette, waiting for the table that fills it.
 *
 * Drawn to the band's exact footprint — same cap, frame, padding, three-column
 * grid and note line — so the moment the lobby lands nothing moves except the
 * placeholders becoming controls. A skeleton of a different shape would make
 * the arrival read as a layout change rather than as contents arriving.
 *
 * The pulse is Motion, not a CSS keyframe: reduced motion turns it into a
 * static dimmed block instead of having to be separately disabled.
 */
export default function LobbyBandSkeleton({ label }: LobbyBandSkeletonProps) {
    const reduceMotion = useReducedMotion();

    const sheen = reduceMotion
        ? { opacity: 0.5 }
        : {
              opacity: [0.35, 0.8],
              transition: {
                  duration: 1.1,
                  ease: "easeInOut" as const,
                  repeat: Infinity,
                  repeatType: "mirror" as const,
              },
          };

    return (
        <div role="status">
            <span className="sr-only">{label}</span>
            <section
                aria-hidden
                className="mx-auto flex w-full max-w-[760px] flex-col gap-3 border-4 border-ink bg-baize-deep p-3 shadow-hard-lg sm:p-4"
            >
                <div className="grid gap-3 sm:grid-cols-[minmax(150px,0.9fr)_minmax(190px,1.2fr)_minmax(160px,auto)] sm:gap-4">
                    {[0, 1, 2].map((cell) => (
                        <div
                            key={cell}
                            className="relative min-h-16 overflow-hidden border-[3px] border-ink bg-baize"
                        >
                            <motion.div
                                animate={sheen}
                                className="absolute inset-0 bg-mint/20"
                            />
                        </div>
                    ))}
                </div>

                <motion.div
                    animate={sheen}
                    className="mx-auto h-4 w-56 max-w-full bg-mint/20"
                />
            </section>
        </div>
    );
}
