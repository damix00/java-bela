"use client";

import { motion } from "motion/react";
import Button from "@/components/input/button";
import { Card, RANK_LABELS, SUITE_SYMBOLS, Suite } from "@/types/game";

function suiteTextColor(suite: Suite) {
    return suite === Suite.HEARTS || suite === Suite.BELLS
        ? "text-red-300"
        : "text-foreground";
}

export default function BelaPrompt({
    card,
    onConfirm,
    onDecline,
}: {
    card: Card;
    onConfirm: () => void;
    onDecline: () => void;
}) {
    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 px-3 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}>
            <motion.div
                className="w-full max-w-sm overflow-hidden rounded-lg border border-primary/25 bg-background-secondary/94 shadow-[0_24px_80px_rgba(0,0,0,0.34)]"
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}>
                <div className="flex flex-col items-center gap-1 px-5 pt-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
                        Bela
                    </p>
                    <h2 className="font-heading text-2xl font-black text-foreground">
                        Declare Bela? +20
                    </h2>
                    <span
                        className={`mt-1 rounded border border-white/10 bg-background px-2 py-1 text-sm font-black ${suiteTextColor(card.suite)}`}>
                        {RANK_LABELS[card.rank]}
                        {SUITE_SYMBOLS[card.suite]}
                    </span>
                </div>

                <div className="flex gap-2 p-4">
                    <Button
                        type="button"
                        variant="ghostPrimary"
                        className="h-10 flex-1 text-sm"
                        onClick={onDecline}>
                        No
                    </Button>
                    <Button
                        type="button"
                        variant="filled"
                        className="h-10 flex-1 text-sm"
                        onClick={onConfirm}>
                        Yes
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}
