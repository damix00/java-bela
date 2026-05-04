"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import { useGame } from "@/context/game-context";

export default function RoundStartOverlay() {
  const { game, phase, setPhase } = useGame();

  useEffect(() => {
    if (phase !== "round_starting") return;

    const timer = setTimeout(() => {
      setPhase("playing");
    }, 2000);

    return () => clearTimeout(timer);
  }, [phase, setPhase]);

  if (phase !== "round_starting" || !game?.currentRound) return null;

  const roundNumber = game.currentRound.roundNumber + 1;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ scale: 0.5, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 1.5, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        {/* Horizontal decorative lines */}
        <motion.div
          className="w-32 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        />

        <motion.span
          className="text-sm uppercase tracking-[0.4em] text-foreground-muted font-bold"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Round
        </motion.span>

        <motion.span
          className="text-7xl md:text-9xl font-heading font-black text-primary leading-none"
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 12,
            delay: 0.15,
          }}
          style={{
            textShadow: "0 0 40px rgba(197,255,139,0.4)",
          }}
        >
          {roundNumber}
        </motion.span>

        <motion.div
          className="w-32 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />

        <motion.span
          className="text-xs uppercase tracking-[0.3em] text-foreground-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2, times: [0, 0.2, 0.7, 1] }}
        >
          Deal the cards...
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
