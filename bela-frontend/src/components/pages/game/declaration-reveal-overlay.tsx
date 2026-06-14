"use client";

import { motion } from "motion/react";
import { CircleSlash } from "lucide-react";
import Button from "@/components/input/button";
import {
    Card,
    Declaration,
    DeclarationType,
    RANK_LABELS,
    SUITE_SYMBOLS,
    Suite,
} from "@/types/game";

function declarationLabel(type: DeclarationType, cards: Card[]) {
    switch (type) {
        case DeclarationType.BELOTE:
            return "Belot";
        case DeclarationType.FOUR_JACKS:
            return "4 Jacks";
        case DeclarationType.FOUR_NINES:
            return "4 Nines";
        case DeclarationType.FOUR_OF_A_KIND:
            return `4 ${cards[0] ? RANK_LABELS[cards[0].rank] : "Cards"}`;
        case DeclarationType.SEQUENCE_3:
            return "Sequence 3";
        case DeclarationType.SEQUENCE_4:
            return "Sequence 4";
        case DeclarationType.SEQUENCE_5:
            return `Sequence ${cards.length}`;
        case DeclarationType.BELA:
            return "Bela";
    }
}

function suiteTextColor(suite: Suite) {
    return suite === Suite.HEARTS || suite === Suite.BELLS
        ? "text-red-300"
        : "text-foreground";
}

function compactCardLabel(card: Card) {
    return `${RANK_LABELS[card.rank]}${SUITE_SYMBOLS[card.suite]}`;
}

export default function DeclarationRevealOverlay({
    declarations,
    getPlayerLabel,
    canDecline = false,
    onDecline,
}: {
    declarations: Declaration[];
    getPlayerLabel: (playerIndex: number) => string;
    canDecline?: boolean;
    onDecline?: () => void;
}) {
    const totalPoints = declarations.reduce(
        (sum, declaration) => sum + declaration.points,
        0,
    );

    if (declarations.length === 0) {
        return null;
    }

    return (
        <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-background/78 px-3 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}>
            <motion.div
                className="w-full max-w-xl overflow-hidden rounded-lg border border-primary/25 bg-background-secondary/94 shadow-[0_24px_80px_rgba(0,0,0,0.34)]"
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}>
                <div className="border-b border-white/10 px-4 py-3 md:px-5">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
                                Zvanja
                            </p>
                            <h2 className="font-heading text-2xl font-black text-foreground md:text-3xl">
                                {totalPoints} points
                            </h2>
                        </div>
                        <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                            Before Play
                        </span>
                    </div>
                </div>

                <div className="max-h-[60dvh] space-y-2 overflow-y-auto p-3 md:p-4">
                    {declarations.map((declaration, index) => (
                        <motion.div
                            key={`${declaration.playerIndex}-${declaration.type}-${index}`}
                            className="rounded-md border border-white/10 bg-white/[0.04] p-3"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.06 * index }}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-bold uppercase tracking-[0.18em] text-foreground-muted">
                                        {getPlayerLabel(
                                            declaration.playerIndex,
                                        )}
                                    </p>
                                    <p className="mt-1 text-sm font-bold text-foreground">
                                        {declarationLabel(
                                            declaration.type,
                                            declaration.cards,
                                        )}
                                    </p>
                                </div>
                                <span className="shrink-0 rounded-md bg-primary px-2 py-1 text-xs font-black text-on-primary">
                                    {declaration.points}
                                </span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {declaration.cards.map((card) => (
                                    <span
                                        key={`${card.suite}-${card.rank}`}
                                        className={`rounded border border-white/10 bg-background px-2 py-1 text-xs font-black ${suiteTextColor(card.suite)}`}>
                                        {compactCardLabel(card)}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {canDecline && (
                    <div className="border-t border-white/10 px-3 py-3 md:px-4">
                        <Button
                            type="button"
                            variant="ghostPrimary"
                            className="h-9 w-full gap-2 text-xs"
                            onClick={onDecline}>
                            <CircleSlash className="h-4 w-4" />
                            Don&apos;t declare
                        </Button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
