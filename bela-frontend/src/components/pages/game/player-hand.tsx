"use client";

import { motion, type PanInfo } from "motion/react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { Card, getCardKey } from "@/types/game";
import { cn } from "@/lib/utils";
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
    onInvalidCardClick,
    interactive = false,
    legalCardKeys,
    pendingCardKey,
    dropTargetRef,
    onDraggingChange,
}: {
    cards: Card[];
    onCardThrow?: (card: Card, index: number, source: "click" | "drag") => void;
    onInvalidCardClick?: (card: Card, index: number) => void;
    interactive?: boolean;
    legalCardKeys?: Set<string>;
    pendingCardKey?: string | null;
    dropTargetRef?: RefObject<HTMLDivElement | null>;
    onDraggingChange?: (dragging: boolean) => void;
}) {
    const suppressClickCardKeyRef = useRef<string | null>(null);
    const draggingCardKeyRef = useRef<string | null>(null);
    const [draggingCardKey, setDraggingCardKey] = useState<string | null>(null);
    const [pressedCardKey, setPressedCardKey] = useState<string | null>(null);
    const [hoveredCardKey, setHoveredCardKey] = useState<string | null>(null);
    const visibleCards = pendingCardKey
        ? cards.filter((card) => getCardKey(card) !== pendingCardKey)
        : cards;
    const visibleCount = visibleCards.length;

    useEffect(() => {
        return () => {
            onDraggingChange?.(false);
            setPressedCardKey(null);
            setHoveredCardKey(null);
        };
    }, [onDraggingChange]);

    const maxSpread = Math.min(visibleCount * 2.6, 18);
    const cardOverlap = visibleCount > 6 ? -30 : visibleCount > 4 ? -24 : -12;

    const handleThrow = (
        card: Card,
        index: number,
        source: "click" | "drag",
    ) => {
        if (!interactive || legalCardKeys?.has(getCardKey(card)) === false) {
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
        const dropTargetRect =
            dropTargetRef?.current?.getBoundingClientRect() ?? null;

        onDraggingChange?.(false);
        setPressedCardKey(null);

        if (isInsideDropTarget(info.point, dropTargetRect)) {
            handleThrow(card, index, "drag");
        }

        window.setTimeout(() => {
            if (draggingCardKeyRef.current === cardKey) {
                draggingCardKeyRef.current = null;
            }
            setDraggingCardKey((current) =>
                current === cardKey ? null : current,
            );
            setPressedCardKey((current) =>
                current === cardKey ? null : current,
            );
            setHoveredCardKey((current) =>
                current === cardKey ? null : current,
            );

            if (suppressClickCardKeyRef.current === cardKey) {
                suppressClickCardKeyRef.current = null;
            }
        }, 0);
    };

    return (
        <motion.div
            className="flex w-full items-end justify-center overflow-visible px-2 sm:px-4"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                type: "spring",
                stiffness: 150,
                damping: 20,
                delay: 0.3,
            }}>
            {visibleCards.map((card, i) => {
                const centerIndex = (visibleCards.length - 1) / 2;
                const offset = i - centerIndex;
                const rotation =
                    offset * (maxSpread / Math.max(visibleCards.length - 1, 1));
                const yOffset = Math.abs(offset) * 4;
                const cardKey = getCardKey(card);
                const isLegal = legalCardKeys?.has(cardKey) !== false;
                const isActionable = interactive && isLegal;

                return (
                    <motion.div
                        key={cardKey}
                        layoutId={
                            draggingCardKey === cardKey
                                ? undefined
                                : `table-card-${cardKey}`
                        }
                        className={cn(
                            "relative shrink-0 pt-6",
                            isActionable &&
                                "cursor-grab active:cursor-grabbing",
                            interactive && !isLegal && "cursor-not-allowed",
                        )}
                        style={{
                            marginLeft: i === 0 ? 0 : cardOverlap,
                            zIndex: hoveredCardKey === cardKey ? 90 : 20 + i,
                        }}
                        initial={{ opacity: 0, y: 80 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                                type: "spring",
                                stiffness: 220,
                                damping: 18,
                                delay: 0.4 + i * 0.05,
                            },
                        }}
                        whileDrag={{
                            scale: 1.04,
                            zIndex: 80,
                            filter: "drop-shadow(0 30px 40px rgba(0, 0, 0, 0.35))",
                        }}
                        drag={isActionable}
                        dragSnapToOrigin
                        dragMomentum={false}
                        dragElastic={0.02}
                        dragTransition={{
                            bounceStiffness: 600,
                            bounceDamping: 30,
                        }}
                        onPointerDown={() => {
                            if (isActionable) {
                                setPressedCardKey(cardKey);
                            }
                        }}
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
                        onPointerEnter={() => {
                            if (isActionable) {
                                setHoveredCardKey(cardKey);
                            }
                        }}
                        onPointerLeave={() => {
                            setHoveredCardKey((current) =>
                                current === cardKey ? null : current,
                            );
                            setPressedCardKey((current) =>
                                current === cardKey ? null : current,
                            );
                        }}
                        onDragStart={() => handleDragStart(cardKey)}
                        onDragEnd={(_, info) => handleDragEnd(card, i, info)}
                        onClick={() => {
                            if (!isActionable) {
                                if (interactive && !isLegal) {
                                    onInvalidCardClick?.(card, i);
                                }
                                return;
                            }

                            if (suppressClickCardKeyRef.current === cardKey) {
                                return;
                            }

                            handleThrow(card, i, "click");
                        }}>
                        <motion.div
                            className="pointer-events-none origin-bottom"
                            animate={{
                                y:
                                    hoveredCardKey === cardKey &&
                                    draggingCardKey !== cardKey &&
                                    pressedCardKey !== cardKey
                                        ? -18 - yOffset
                                        : -yOffset,
                                rotate:
                                    hoveredCardKey === cardKey &&
                                    draggingCardKey !== cardKey &&
                                    pressedCardKey !== cardKey
                                        ? rotation * 0.85
                                        : rotation,
                                scale:
                                    hoveredCardKey === cardKey &&
                                    draggingCardKey !== cardKey &&
                                    pressedCardKey !== cardKey
                                        ? 1.03
                                        : 1,
                                filter:
                                    hoveredCardKey === cardKey &&
                                    draggingCardKey !== cardKey &&
                                    pressedCardKey !== cardKey
                                        ? "drop-shadow(0 20px 28px rgba(0, 0, 0, 0.28))"
                                        : "drop-shadow(0 0 0 rgba(0, 0, 0, 0))",
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 420,
                                damping: 32,
                                mass: 0.6,
                            }}>
                            <PlayingCard
                                card={card}
                                interactive={false}
                                className={cn(
                                    "origin-bottom shadow-[0_14px_24px_rgba(15,23,42,0.18)] transition-opacity",
                                    interactive && !isLegal && "saturate-50",
                                )}
                            />
                        </motion.div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
