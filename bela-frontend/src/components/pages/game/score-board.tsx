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
      className="flex items-stretch overflow-hidden rounded-lg border border-background-tertiary bg-background-secondary/80 backdrop-blur-sm md:rounded-xl"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <div className="flex flex-col items-center px-3 py-1.5 md:px-8 md:py-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
          We
        </span>
        <motion.span
          key={team1Score}
          className="font-heading text-xl font-bold text-foreground md:text-4xl"
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {team1Score}
        </motion.span>
      </div>

      <div className="w-px bg-background-tertiary" />

      <div className="flex flex-col items-center px-3 py-1.5 md:px-8 md:py-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
          They
        </span>
        <motion.span
          key={team2Score}
          className="font-heading text-xl font-bold text-foreground md:text-4xl"
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
