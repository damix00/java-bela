"use client";

import { motion, type PanInfo } from "motion/react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { Card, getCardKey } from "@/types/game";
import PlayingCard from "./playing-card";

function isInsideDropTarget(
  point: { x: number; y: number },
  dropTargetRect: DOMRect | null,
) {
  if (!dropTargetRect) {
    return false;
  }

  return (
    point.x >= dropTargetRect.left &&
    point.x <= dropTargetRect.right &&
    point.y >= dropTargetRect.top &&
    point.y <= dropTargetRect.bottom
  );
}

export default function PlayerHand({
  cards,
  onCardThrow,
  interactive = false,
  pendingCardKey,
  dropTargetRef,
  onDraggingChange,
}: {
  cards: Card[];
  onCardThrow?: (card: Card, index: number, source: "click" | "drag") => void;
  interactive?: boolean;
  pendingCardKey?: string | null;
  dropTargetRef?: RefObject<HTMLDivElement | null>;
  onDraggingChange?: (dragging: boolean) => void;
}) {
  const suppressClickCardKeyRef = useRef<string | null>(null);
  const draggingCardKeyRef = useRef<string | null>(null);
  const [draggingCardKey, setDraggingCardKey] = useState<string | null>(null);
  const [pressedCardKey, setPressedCardKey] = useState<string | null>(null);
  const visibleCards = pendingCardKey
    ? cards.filter((card) => getCardKey(card) !== pendingCardKey)
    : cards;
  const visibleCount = visibleCards.length;

  useEffect(() => {
    return () => {
      onDraggingChange?.(false);
      setPressedCardKey(null);
    };
  }, [onDraggingChange]);

  const maxSpread = Math.min(visibleCount * 3, 20);
  const cardOverlap = visibleCount > 4 ? -20 : -10;

  const handleThrow = (
    card: Card,
    index: number,
    source: "click" | "drag",
  ) => {
    if (!interactive) {
      return;
    }

    onCardThrow?.(card, index, source);
  };

  const handleDragStart = (cardKey: string) => {
    draggingCardKeyRef.current = cardKey;
    setDraggingCardKey(cardKey);
    setPressedCardKey(cardKey);
    suppressClickCardKeyRef.current = cardKey;
    onDraggingChange?.(true);
  };

  const handleDragEnd = (card: Card, index: number, info: PanInfo) => {
    const cardKey = getCardKey(card);
    const dropTargetRect = dropTargetRef?.current?.getBoundingClientRect() ?? null;

    onDraggingChange?.(false);
    setPressedCardKey(null);

    if (isInsideDropTarget(info.point, dropTargetRect)) {
      handleThrow(card, index, "drag");
    }

    window.setTimeout(() => {
      if (draggingCardKeyRef.current === cardKey) {
        draggingCardKeyRef.current = null;
      }
      setDraggingCardKey((current) => (current === cardKey ? null : current));
      setPressedCardKey((current) => (current === cardKey ? null : current));

      if (suppressClickCardKeyRef.current === cardKey) {
        suppressClickCardKeyRef.current = null;
      }
    }, 0);
  };

  return (
    <motion.div
      className="flex items-end justify-center px-4"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 150, damping: 20, delay: 0.3 }}
    >
      {visibleCards.map((card, i) => {
        const centerIndex = (visibleCards.length - 1) / 2;
        const offset = i - centerIndex;
        const rotation = offset * (maxSpread / Math.max(visibleCards.length - 1, 1));
        const yOffset = Math.abs(offset) * 4;
        const cardKey = getCardKey(card);

        return (
          <motion.div
            key={cardKey}
            layoutId={
              draggingCardKey === cardKey ? undefined : `table-card-${cardKey}`
            }
            className="relative"
            style={{
              marginLeft: i === 0 ? 0 : cardOverlap,
              zIndex: 20 + i,
            }}
            initial={{ opacity: 0, y: 80, rotate: 0 }}
            animate={{
              opacity: 1,
              y: -yOffset,
              rotate: rotation,
              transition: {
                type: "spring",
                stiffness: 220,
                damping: 18,
                delay: 0.4 + i * 0.05,
              },
            }}
            whileHover={
              interactive &&
              draggingCardKey !== cardKey &&
              pressedCardKey !== cardKey
                ? {
                    y: -20 - yOffset,
                    rotate: rotation * 0.7,
                    scale: 1.04,
                    transition: {
                      type: "spring",
                      stiffness: 350,
                      damping: 18,
                    },
                  }
                : undefined
            }
            whileDrag={{
              scale: 1.04,
              zIndex: 80,
              filter: "drop-shadow(0 30px 40px rgba(0, 0, 0, 0.35))",
            }}
            drag={interactive}
            dragSnapToOrigin
            dragMomentum={false}
            dragElastic={0.02}
            dragTransition={{
              bounceStiffness: 600,
              bounceDamping: 30,
            }}
            onPointerDown={() => setPressedCardKey(cardKey)}
            onPointerUp={() =>
              setPressedCardKey((current) =>
                current === cardKey ? null : current,
              )
            }
            onPointerCancel={() =>
              setPressedCardKey((current) =>
                current === cardKey ? null : current,
              )
            }
            onDragStart={() => handleDragStart(cardKey)}
            onDragEnd={(_, info) => handleDragEnd(card, i, info)}
          >
            <PlayingCard
              card={card}
              interactive={interactive}
              className="origin-bottom"
              onClick={() => {
                if (suppressClickCardKeyRef.current === cardKey) {
                  return;
                }

                handleThrow(card, i, "click");
              }}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
