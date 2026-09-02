"use client";

import { Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { panelRaised } from "@/lib/ui/styles";

type BelaAnnouncementProps = {
    message: string;
    pointsLabel: string;
};

/** A public, non-blocking call: everyone at the table sees who announced bela. */
export default function BelaAnnouncement({
    message,
    pointsLabel,
}: BelaAnnouncementProps) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            role="status"
            aria-live="assertive"
            initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
            className={`${panelRaised} pointer-events-auto flex items-center gap-3 bg-baize-deep px-4 py-3 text-cream shadow-[0_8px_30px_rgb(0_0_0_/_0.32)]`}
        >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rust text-cream">
                <Sparkles size={19} strokeWidth={2.5} aria-hidden />
            </span>
            <span className="min-w-0">
                <span className="block truncate font-display text-[15px] font-extrabold">
                    {message}
                </span>
                <span className="block text-[12px] font-semibold text-mint/70">
                    {pointsLabel}
                </span>
            </span>
        </motion.div>
    );
}
