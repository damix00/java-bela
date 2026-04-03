"use client";

import { motion } from "motion/react";

export default function ScoreBoard({
  team1Score,
  team2Score,
}: {
  team1Score: number;
  team2Score: number;
}) {
  return (
    <motion.div
      className="flex items-stretch rounded-xl border border-background-tertiary bg-background-secondary/80 backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <div className="flex flex-col items-center px-5 py-2 md:px-8 md:py-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
          We
        </span>
        <motion.span
          key={team1Score}
          className="text-2xl md:text-4xl font-heading font-bold text-foreground"
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {team1Score}
        </motion.span>
      </div>

      <div className="w-px bg-background-tertiary" />

      <div className="flex flex-col items-center px-5 py-2 md:px-8 md:py-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
          They
        </span>
        <motion.span
          key={team2Score}
          className="text-2xl md:text-4xl font-heading font-bold text-foreground"
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {team2Score}
        </motion.span>
      </div>
    </motion.div>
  );
}
