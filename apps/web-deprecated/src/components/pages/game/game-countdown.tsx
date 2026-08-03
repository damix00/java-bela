"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useGame } from "@/context/game-context";

const COUNTDOWN_STEPS = ["3", "2", "1", "GO!"] as const;

export default function GameCountdown() {
    const { phase } = useGame();
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        if (phase !== "countdown") return;

        const timers = COUNTDOWN_STEPS.slice(1).map((_, index) =>
            window.setTimeout(() => {
                setStepIndex(index + 1);
            }, (index + 1) * 1000),
        );

        return () => {
            timers.forEach((timer) => window.clearTimeout(timer));
        };
    }, [phase]);

    if (phase !== "countdown") return null;

    const label = COUNTDOWN_STEPS[stepIndex];
    const isGo = label === "GO!";

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background/90 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}>
            <motion.div
                className="absolute h-80 w-80 rounded-full bg-primary/10 blur-3xl"
                animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.6, 1, 0.6] }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            <motion.div
                className="absolute h-72 w-72 rounded-full border border-primary/15"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_24px_rgba(197,255,139,0.8)]" />
                <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-primary/70" />
            </motion.div>

            <motion.div
                className="absolute h-96 w-96 rounded-full border border-primary/10"
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}>
                <div className="absolute right-7 top-16 h-2 w-14 rounded-full bg-primary/30 blur-[1px]" />
                <div className="absolute bottom-20 left-8 h-2 w-10 rounded-full bg-primary/20 blur-[1px]" />
            </motion.div>

            <AnimatePresence initial={false}>
                <motion.div
                    key={`burst-${label}`}
                    className="absolute h-44 w-44 rounded-full border-2 border-primary/35 will-change-transform"
                    initial={{ opacity: 0.55, scale: 0.45 }}
                    animate={{ opacity: 0, scale: isGo ? 3.6 : 2.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: isGo ? 0.7 : 0.5, ease: "easeOut" }}
                />
            </AnimatePresence>

            <div className="relative flex h-64 w-80 flex-col items-center justify-center md:h-80 md:w-96">
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                        key={label}
                        className="absolute flex flex-col items-center justify-center gap-3 will-change-transform"
                        initial={{
                            opacity: 0,
                            scale: isGo ? 0.65 : 0.72,
                            y: 18,
                            rotate: isGo ? -4 : 0,
                        }}
                        animate={{
                            opacity: 1,
                            scale: [isGo ? 0.65 : 0.72, 1.08, 1],
                            y: [18, -4, 0],
                            rotate: 0,
                        }}
                        exit={{
                            opacity: 0,
                            scale: isGo ? 1.3 : 1.18,
                            y: -22,
                            rotate: isGo ? 3 : 0,
                        }}
                        transition={{
                            duration: isGo ? 0.38 : 0.3,
                            ease: [0.16, 1, 0.3, 1],
                        }}>
                        <motion.span
                            className={`font-heading font-black leading-none text-primary ${
                                isGo
                                    ? "text-[7rem] md:text-[11rem]"
                                    : "text-[10rem] md:text-[14rem]"
                            }`}
                            style={{
                                textShadow:
                                    "0 0 48px rgba(197,255,139,0.45)",
                            }}
                            animate={{
                                textShadow: [
                                    "0 0 24px rgba(197,255,139,0.35)",
                                    "0 0 72px rgba(197,255,139,0.65)",
                                    "0 0 40px rgba(197,255,139,0.45)",
                                ],
                            }}
                            transition={{ duration: 0.45, ease: "easeOut" }}>
                            {label}
                        </motion.span>

                        <motion.span
                            className="text-sm font-bold uppercase tracking-[0.3em] text-foreground-muted"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: 0.08 }}>
                            {isGo ? "Start" : "Get Ready"}
                        </motion.span>
                    </motion.div>
                </AnimatePresence>
            </div>

            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="absolute h-40 w-40 rounded-full border border-primary/15 will-change-transform"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{
                        scale: [0.6, 2.7],
                        opacity: [0, 0.24, 0],
                    }}
                    transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        delay: i * 0.6,
                        ease: "easeOut",
                    }}
                />
            ))}
        </motion.div>
    );
}
