"use client";

import { motion } from "motion/react";
import { Card } from "@/types/game";
import PlayingCard from "./playing-card";

export default function PlayerHand({
  cards,
  onCardClick,
  interactive = false,
}: {
  cards: Card[];
  onCardClick?: (card: Card, index: number) => void;
  interactive?: boolean;
}) {
  const count = cards.length;

  // Fan spread: each card rotated slightly, offset horizontally
  const maxSpread = Math.min(count * 3, 20); // max rotation spread in degrees
  const cardOverlap = count > 4 ? -20 : -10; // negative margin to overlap

  return (
    <motion.div
      className="flex items-end justify-center"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 150, damping: 20, delay: 0.3 }}
    >
      {cards.map((card, i) => {
        // Calculate rotation for fan effect
        const centerIndex = (count - 1) / 2;
        const offset = i - centerIndex;
        const rotation = offset * (maxSpread / Math.max(count - 1, 1));
        // Slight vertical arc
        const yOffset = Math.abs(offset) * 4;

        return (
          <motion.div
            key={`${card.suite}-${card.rank}`}
            className="relative"
            style={{
              marginLeft: i === 0 ? 0 : cardOverlap,
              zIndex: i,
            }}
            initial={{ opacity: 0, y: 80, rotate: 0 }}
            animate={{
              opacity: 1,
              y: -yOffset,
              rotate: rotation,
            }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 18,
              delay: 0.4 + i * 0.06,
            }}
          >
            <PlayingCard
              card={card}
              interactive={interactive}
              onClick={() => onCardClick?.(card, i)}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
