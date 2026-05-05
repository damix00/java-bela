"use client";

import { AnimatePresence, motion } from "motion/react";
import { type RefObject } from "react";
import {
  Card,
  getCardKey,
  PlayedCard as PlayedCardType,
  Rank,
  Suite,
} from "@/types/game";
import PlayingCard from "./playing-card";

const CARD_TRANSFORMS: Record<number, { x: number; y: number; rotate: number }> = {
  0: { x: 0, y: -46, rotate: -6 },
  1: { x: 56, y: -2, rotate: 9 },
  2: { x: 0, y: 46, rotate: 4 },
  3: { x: -56, y: -2, rotate: -9 },
};

const STACK_TRANSFORMS = [
  { x: -16, y: 8, rotate: -12 },
  { x: -4, y: 2, rotate: -5 },
  { x: 10, y: -4, rotate: 8 },
];

const FACE_DOWN_CARD: Card = {
  suite: Suite.HEARTS,
  rank: Rank.ACE,
  trump: false,
  hidden: true,
};

export default function CenterTrick({
  playedCards,
  playerSeatMapping,
  previewCard,
  previewPlayerIndex,
  dropTargetRef,
  isDropTargetActive = false,
}: {
  playedCards: PlayedCardType[];
  playerSeatMapping: Record<number, number>;
  previewCard?: Card | null;
  previewPlayerIndex?: number | null;
  dropTargetRef?: RefObject<HTMLDivElement | null>;
  isDropTargetActive?: boolean;
}) {
  const previewCardAlreadyPlayed =
    previewCard &&
    playedCards.some(
      (playedCard) =>
        playedCard.playerIndex === previewPlayerIndex &&
        getCardKey(playedCard.card) === getCardKey(previewCard),
    );

  const renderedCards = previewCard && !previewCardAlreadyPlayed
    ? [
        ...playedCards,
        {
          playerIndex: previewPlayerIndex ?? -1,
          card: previewCard,
        },
      ]
    : playedCards;

  return (
    <div className="relative flex h-52 w-52 items-center justify-center md:h-64 md:w-64">
      <motion.div
        ref={dropTargetRef}
        className="absolute inset-6 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-[2px]"
        animate={{
          scale: isDropTargetActive ? 1.04 : 1,
          borderColor: isDropTargetActive
            ? "rgba(245, 208, 66, 0.6)"
            : "rgba(255, 255, 255, 0.1)",
          boxShadow: isDropTargetActive
            ? "0 0 0 1px rgba(245, 208, 66, 0.35), 0 28px 60px rgba(0, 0, 0, 0.26)"
            : "0 20px 40px rgba(0, 0, 0, 0.18)",
        }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
      />

      {STACK_TRANSFORMS.map((transform, index) => (
        <motion.div
          key={index}
          className="absolute"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{
            opacity: 1,
            x: transform.x,
            y: transform.y,
            rotate: transform.rotate,
            scale: isDropTargetActive ? 1.02 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 22,
            delay: 0.06 * index,
          }}
        >
          <PlayingCard
            card={FACE_DOWN_CARD}
            faceDown
            small
            className="shadow-[0_18px_28px_rgba(0,0,0,0.28)]"
          />
        </motion.div>
      ))}

      <motion.div
        className="pointer-events-none absolute inset-0 rounded-full"
        animate={{
          opacity: isDropTargetActive ? 1 : 0.4,
          scale: isDropTargetActive ? 1.06 : 0.92,
        }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 28%, rgba(255,255,255,0) 68%)",
        }}
      />

      <AnimatePresence>
        {renderedCards.map((playedCard, index) => {
          const visualPos = playerSeatMapping[playedCard.playerIndex] ?? 2;
          const transform = CARD_TRANSFORMS[visualPos];
          const cardKey = getCardKey(playedCard.card);

          return (
            <motion.div
              key={`${playedCard.playerIndex}-${cardKey}`}
              layoutId={`table-card-${cardKey}`}
              className="absolute"
              initial={{
                opacity: 0,
                scale: 0.62,
                x: transform.x * 2.2,
                y: transform.y * 2.2,
                rotate: transform.rotate * 1.6,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                x: transform.x,
                y: transform.y,
                rotate: transform.rotate,
              }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 22,
                mass: 0.85,
                delay: index * 0.03,
              }}
              style={{ zIndex: 20 + index }}
            >
              <PlayingCard
                card={playedCard.card}
                small
                className="shadow-[0_22px_32px_rgba(0,0,0,0.3)]"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
