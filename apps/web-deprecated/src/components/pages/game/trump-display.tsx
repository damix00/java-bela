"use client";

import { motion } from "motion/react";
import { Suite, SUITE_SYMBOLS, SUITE_NAMES } from "@/types/game";

export default function TrumpDisplay({ suite }: { suite: Suite | null }) {
  if (!suite) return null;

  const symbol = SUITE_SYMBOLS[suite];
  const name = SUITE_NAMES[suite];
  const isRed = suite === Suite.HEARTS || suite === Suite.BELLS;

  return (
    <motion.div
      className="flex flex-col items-center gap-1 rounded-xl border border-primary/30 bg-primary-muted/60 backdrop-blur-sm px-4 py-2 md:px-6 md:py-3"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
    >
      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
        Trump
      </span>
      <div className="flex items-center gap-2">
        <span className={`text-xl md:text-2xl ${isRed ? "text-red-400" : "text-white"}`}>
          {symbol}
        </span>
        <span className="text-sm md:text-base font-heading font-bold uppercase tracking-wider text-primary">
          {name}
        </span>
      </div>
    </motion.div>
  );
}
