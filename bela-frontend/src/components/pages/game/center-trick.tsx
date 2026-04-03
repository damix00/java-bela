"use client";

import { motion, AnimatePresence } from "motion/react";
import { PlayedCard as PlayedCardType } from "@/types/game";
import PlayingCard from "./playing-card";

// Card positions/rotations for each player seat index relative to center
const CARD_TRANSFORMS: Record<number, { x: number; y: number; rotate: number }> = {
  0: { x: 0, y: -30, rotate: -5 },   // top player
  1: { x: 40, y: 0, rotate: 8 },     // right player
  2: { x: 0, y: 30, rotate: 3 },     // bottom player (current user)
  3: { x: -40, y: 0, rotate: -8 },   // left player
};

export default function CenterTrick({
  playedCards,
  playerSeatMapping,
}: {
  playedCards: PlayedCardType[];
  // Maps backend seatIndex → visual position (0=top, 1=right, 2=bottom, 3=left)
  playerSeatMapping: Record<number, number>;
}) {
  return (
    <div className="relative w-40 h-40 md:w-52 md:h-52 flex items-center justify-center">
      <AnimatePresence>
        {playedCards.map((pc, i) => {
          const visualPos = playerSeatMapping[pc.playerIndex] ?? 0;
          const transform = CARD_TRANSFORMS[visualPos];

          return (
            <motion.div
              key={`${pc.playerIndex}-${i}`}
              className="absolute"
              initial={{
                opacity: 0,
                scale: 0.5,
                x: transform.x * 3,
                y: transform.y * 3,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                x: transform.x,
                y: transform.y,
                rotate: transform.rotate,
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 250, damping: 20 }}
            >
              <PlayingCard card={pc.card} small />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
