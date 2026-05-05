"use client";

import { motion } from "motion/react";
import {
  Card,
  RANK_LABELS,
  SUITE_SYMBOLS,
  Suite,
} from "@/types/game";

function getSuiteColor(suite: Suite) {
  return suite === Suite.HEARTS || suite === Suite.BELLS
    ? "text-red-500"
    : "text-neutral-900";
}

function getSuiteBg(suite: Suite) {
  return suite === Suite.HEARTS || suite === Suite.BELLS
    ? "text-red-200/30"
    : "text-neutral-300/30";
}

export default function PlayingCard({
  card,
  onClick,
  interactive = false,
  small = false,
  faceDown = false,
  style,
  className = "",
}: {
  card: Card;
  onClick?: () => void;
  interactive?: boolean;
  small?: boolean;
  faceDown?: boolean;
  style?: React.CSSProperties;
  className?: string;
}) {
  const w = small ? "w-14 h-20" : "w-20 h-28 md:w-24 md:h-34";

  if (faceDown || card.hidden) {
    return (
      <motion.div
        className={`${w} rounded-lg bg-gradient-to-br from-emerald-900 to-emerald-950 border border-emerald-700/50 shadow-lg flex items-center justify-center ${className}`}
        style={style}
      >
        <div className="w-3/4 h-3/4 rounded border border-emerald-600/30 bg-emerald-800/40" />
      </motion.div>
    );
  }

  const rank = RANK_LABELS[card.rank];
  const symbol = SUITE_SYMBOLS[card.suite];
  const color = getSuiteColor(card.suite);
  const bgColor = getSuiteBg(card.suite);

  return (
    <motion.div
      className={`${w} rounded-[18px] bg-white shadow-lg flex flex-col justify-between p-1.5 md:p-2 select-none relative overflow-hidden border border-white/80 ${
        interactive
          ? "cursor-pointer"
          : ""
      } ${card.trump ? "ring-2 ring-primary/40" : ""} ${className}`}
      style={style}
      onClick={interactive ? onClick : undefined}
      whileHover={
        interactive
          ? {
              y: -12,
              scale: 1.05,
              boxShadow: "0 24px 36px rgba(15, 23, 42, 0.26)",
            }
          : undefined
      }
      whileTap={interactive ? { scale: 0.98, y: -6 } : undefined}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
    >
      {/* Large background symbol */}
      <span
        className={`absolute inset-0 flex items-center justify-center ${bgColor} pointer-events-none`}
        style={{ fontSize: small ? "3rem" : "4.5rem" }}
      >
        {symbol}
      </span>

      {/* Top-left rank + suit */}
      <div className={`flex flex-col items-center leading-none z-10 self-start ${color}`}>
        <span className={`font-bold ${small ? "text-xs" : "text-base md:text-lg"}`}>
          {rank}
        </span>
        <span className={small ? "text-xs" : "text-sm"}>
          {symbol}
        </span>
      </div>

      {/* Bottom-right rank + suit (rotated) */}
      <div
        className={`flex flex-col items-center leading-none z-10 self-end rotate-180 ${color}`}
      >
        <span className={`font-bold ${small ? "text-xs" : "text-base md:text-lg"}`}>
          {rank}
        </span>
        <span className={small ? "text-xs" : "text-sm"}>
          {symbol}
        </span>
      </div>
    </motion.div>
  );
}
