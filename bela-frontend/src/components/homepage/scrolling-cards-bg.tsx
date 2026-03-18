"use client";

import { useMemo, useSyncExternalStore } from "react";
import { PlayingCard } from "./playing-card";

const suits = [
    { suit: "♠", color: "text-foreground" },
    { suit: "♥", color: "text-red-500" },
    { suit: "♦", color: "text-red-500" },
    { suit: "♣", color: "text-foreground" },
];

const ranks = ["A", "K", "Q", "J", "10", "9", "8", "7"];

// Card sizes and gaps matching the tailwind classes
const CARD_SPECS = {
    sm: { width: 128, gap: 32 }, // w-32, gap-8
    md: { width: 192, gap: 64 }, // md:w-48, md:gap-16
    lg: { width: 256, gap: 64 }, // lg:w-64, gap-16
};

const DURATION = 500;
const ROTATION_DEG = 12;
const SCALE = 1.25;

function getSpec() {
    const w = window.innerWidth;
    if (w >= 1024) return CARD_SPECS.lg;
    if (w >= 768) return CARD_SPECS.md;
    return CARD_SPECS.sm;
}

function computeCounts() {
    const { width: cardW, gap } = getSpec();
    const aspectRatio = 3.5 / 2.5;
    const cardH = cardW * aspectRatio;

    // Account for the -12deg rotation + 125% scale when computing how much space to fill
    const cosR = Math.cos((ROTATION_DEG * Math.PI) / 180);
    const effectiveW = (window.innerWidth / cosR) * SCALE;
    const effectiveH = (window.innerHeight / cosR) * SCALE;

    const colCount = Math.ceil(effectiveW / (cardW + gap)) + 1;
    // Cards needed to fill 200vh (the column clip height), halved since we duplicate for the loop
    const cardsPerCol = Math.ceil((effectiveH * 2) / (cardH + gap)) + 1;

    return { colCount, cardsPerCol };
}

function generateCards(colIndex: number, count: number) {
    return Array.from({ length: count }).map((_, i) => {
        const suitIdx = (colIndex + i) % suits.length;
        const rankIdx = (colIndex * 3 + i * 7) % ranks.length;
        return { id: i, ...suits[suitIdx], rank: ranks[rankIdx] };
    });
}

// SSR-safe screen size subscription
const subscribe = (cb: () => void) => {
    window.addEventListener("resize", cb);
    return () => window.removeEventListener("resize", cb);
};
const getSnapshot = () => `${window.innerWidth}x${window.innerHeight}`;
const getServerSnapshot = () => "0x0";

export function ScrollingCardsBg() {
    const size = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    );

    const columns = useMemo(() => {
        // On the server (0x0), render nothing — the client will hydrate with real values
        if (size === "0x0") return [];

        const { colCount, cardsPerCol } = computeCounts();
        const totalCards = colCount * cardsPerCol * 2; // *2 for the duplicate loop
        console.log(
            `%cCards Rendered: ${totalCards}%c (${colCount} cols * ${cardsPerCol} cards * 2)`,
            "color: #10b981; font-weight: bold;",
            "color: #6b7280;",
        );

        return Array.from({ length: colCount }).map((_, i) => ({
            cards: generateCards(i, cardsPerCol),
            direction: i % 2 === 0 ? -1 : 1,
        }));
    }, [size]);

    if (columns.length === 0) return null;

    return (
        <div className="absolute inset-0 overflow-hidden -z-10 bg-background flex items-center justify-center">
            <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-transparent via-background/50 to-background" />

            <div className="flex gap-8 md:gap-16 min-w-[150vw] items-center justify-center -rotate-12 scale-125">
                {columns.map((col, colIdx) => (
                    <div
                        key={colIdx}
                        className="shrink-0 flex flex-col gap-8 md:gap-16 h-[200vh] overflow-hidden"
                        style={{ backfaceVisibility: "hidden" }}>
                        <div
                            className="flex flex-col gap-8 md:gap-16"
                            style={{
                                animation: `${col.direction === -1 ? "scroll-up" : "scroll-down"} ${DURATION}s linear infinite`,
                                willChange: "transform",
                                backfaceVisibility: "hidden",
                            }}>
                            {[...col.cards, ...col.cards].map((card, idx) => (
                                <PlayingCard
                                    key={`${colIdx}-${idx}`}
                                    suit={card.suit}
                                    rank={card.rank}
                                    color={card.color}
                                    className="opacity-10"
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
