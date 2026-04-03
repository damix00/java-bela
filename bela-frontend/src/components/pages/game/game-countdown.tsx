"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useGame } from "@/context/game-context";

export default function GameCountdown() {
  const { phase, setPhase } = useGame();
  const [count, setCount] = useState(3);
  const [showGo, setShowGo] = useState(false);

  useEffect(() => {
    if (phase !== "countdown") return;

    setCount(3);
    setShowGo(false);

    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowGo(true);
          setTimeout(() => {
            setPhase("round_starting");
          }, 800);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, setPhase]);

  if (phase !== "countdown") return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Radial glow behind number */}
      <div className="absolute w-64 h-64 rounded-full bg-primary/10 blur-3xl" />

      <AnimatePresence mode="wait">
        {!showGo ? (
          <motion.div
            key={count}
            className="relative flex flex-col items-center"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            {/* Count number */}
            <motion.span
              className="text-[10rem] md:text-[14rem] font-heading font-black text-primary leading-none"
              animate={{
                textShadow: [
                  "0 0 20px rgba(197,255,139,0.3)",
                  "0 0 60px rgba(197,255,139,0.5)",
                  "0 0 20px rgba(197,255,139,0.3)",
                ],
              }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {count}
            </motion.span>

            {/* Subtitle */}
            <motion.span
              className="text-sm uppercase tracking-[0.3em] text-foreground-muted font-bold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              Get Ready
            </motion.span>
          </motion.div>
        ) : (
          <motion.div
            key="go"
            className="flex flex-col items-center"
            initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 3, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 12 }}
          >
            <motion.span
              className="text-[8rem] md:text-[12rem] font-heading font-black text-primary leading-none"
              animate={{
                textShadow: "0 0 80px rgba(197,255,139,0.6)",
              }}
            >
              GO!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative ring pulses */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-primary/20"
          initial={{ width: 100, height: 100, opacity: 0 }}
          animate={{
            width: [100, 400],
            height: [100, 400],
            opacity: [0.4, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeOut",
          }}
        />
      ))}
    </motion.div>
  );
}
