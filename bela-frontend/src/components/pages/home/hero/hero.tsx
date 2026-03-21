"use client";

import { motion } from "motion/react";
import HeroBackground from "./hero-background";
import HeroButton from "./hero-button";

export default function HomeHero() {
    return (
        <div className="py-titlebar relative min-h-svh w-full flex flex-col items-center justify-center gap-6 px-4 sm:px-6 md:px-8">
            <HeroBackground />
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 20,
                    staggerChildren: 0.15,
                }}
                className="relative z-10 w-full max-w-6xl flex flex-col justify-center">
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="relative z-10 font-heading uppercase font-black text-4xl leading-[0.95] sm:text-5xl md:text-7xl lg:text-8xl text-center tracking-tight">
                    Play <span className="text-primary">Belote.</span>
                    <br />
                    Prove yourself.
                </motion.h1>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 20,
                        delay: 0.15,
                    }}
                    className="flex justify-center mt-4 sm:mt-5">
                    <p className="text-center max-w-md sm:max-w-2xl px-2 text-sm sm:text-base md:text-lg font-medium text-foreground-muted">
                        The competitive Belote platform for players of all skill
                        levels.
                    </p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 20,
                        delay: 0.3,
                    }}
                    className="flex justify-center mt-5 sm:mt-6 px-2">
                    <HeroButton />
                </motion.div>
            </motion.div>
        </div>
    );
}
