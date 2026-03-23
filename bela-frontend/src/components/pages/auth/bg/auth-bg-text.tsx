"use client";

import { motion } from "motion/react";
import { fadeUpAnimation, springTransition } from "@/config/animations";

export default function AuthBgText() {
    return (
        <>
            <motion.p
                className="font-heading font-bold text-sm text-foreground-muted mb-2 uppercase"
                {...fadeUpAnimation}
                transition={springTransition}>
                Where champions play
            </motion.p>
            <motion.p
                className="text-4xl font-bold"
                {...fadeUpAnimation}
                transition={{ ...springTransition, delay: 0.15 }}>
                Play the game you love, at the highest level.
            </motion.p>
        </>
    );
}
