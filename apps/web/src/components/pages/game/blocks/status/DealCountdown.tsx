"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/** Mirrors `GameFlowService.NEXT_ROUND_DELAY` on the API. */
const DEAL_COUNTDOWN_SECONDS = 5;

/** The animated count shown while the server schedules the first deal. */
export default function DealCountdown({ label }: { label: string }) {
    const reduceMotion = useReducedMotion();
    const [startedAt] = useState(() => Date.now());
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        // Sample more often than the visible second so a delayed interval does
        // not make the countdown drift away from the server's five-second task.
        const id = window.setInterval(() => setNow(Date.now()), 200);
        return () => window.clearInterval(id);
    }, []);

    const elapsedSeconds = Math.floor((now - startedAt) / 1000);
    const remaining = Math.max(1, DEAL_COUNTDOWN_SECONDS - elapsedSeconds);
    const transition = reduceMotion
        ? { duration: 0 }
        : { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const };

    return (
        <div
            role="timer"
            aria-live="off"
            aria-label={`${label} ${remaining}`}
            className="relative grid size-24 place-items-center sm:size-28"
        >
            <AnimatePresence initial={false}>
                <motion.span
                    key={`pulse-${remaining}`}
                    aria-hidden="true"
                    initial={
                        reduceMotion ? false : { opacity: 0.6, scale: 0.55 }
                    }
                    animate={{ opacity: 0, scale: reduceMotion ? 1 : 1.45 }}
                    transition={
                        reduceMotion
                            ? { duration: 0 }
                            : { duration: 0.7, ease: "easeOut" }
                    }
                    className="absolute inset-0 border-4 border-rust"
                />

                <motion.span
                    key={remaining}
                    aria-hidden="true"
                    initial={
                        reduceMotion
                            ? false
                            : { opacity: 0, scale: 0.45, y: 10 }
                    }
                    animate={
                        reduceMotion
                            ? { opacity: 1 }
                            : {
                                  opacity: 1,
                                  scale: [0.45, 1.12, 1],
                                  y: [10, -2, 0],
                              }
                    }
                    exit={
                        reduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, scale: 1.3, y: -8 }
                    }
                    transition={transition}
                    className="absolute font-display text-[64px] leading-none font-black text-cream tabular-nums sm:text-[76px]"
                >
                    {remaining}
                </motion.span>
            </AnimatePresence>
        </div>
    );
}
