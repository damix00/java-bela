"use client";

import { motion } from "motion/react";
import { fadeUpAnimation, springTransition } from "@/config/animations";

export default function AuthBgText({
    eyebrow,
    headline,
}: {
    eyebrow: string;
    headline: string;
}) {
    return (
        <>
            <motion.p
                className="font-heading font-bold text-sm text-foreground-muted mb-2 uppercase"
                {...fadeUpAnimation}
                transition={springTransition}>
                {eyebrow}
            </motion.p>
            <motion.p
                className="text-4xl font-bold"
                {...fadeUpAnimation}
                transition={{ ...springTransition, delay: 0.15 }}>
                {headline}
            </motion.p>
        </>
    );
}
