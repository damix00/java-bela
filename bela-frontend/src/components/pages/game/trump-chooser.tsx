"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { CircleChevronRight } from "lucide-react";
import Button from "@/components/input/button";
import {
  Suite,
  SUITE_NAMES,
  SUITE_SYMBOLS,
} from "@/types/game";

function suiteTone(suite: Suite) {
  return suite === Suite.HEARTS || suite === Suite.BELLS
    ? "text-red-400 border-red-400/30 hover:border-red-400"
    : "text-white border-white/20 hover:border-white/50";
}

export default function TrumpChooser({
  currentTurnIndex,
  mySeatIndex,
  roundNumber,
  timeoutSeconds,
  startedAt,
  onChoose,
  onPass,
}: {
  currentTurnIndex: number;
  mySeatIndex: number;
  roundNumber: number;
  timeoutSeconds: number;
  startedAt: number;
  onChoose: (suite: Suite) => void;
  onPass: () => void;
}) {
  const [now, setNow] = useState(startedAt);
  const isMyTurn = currentTurnIndex === mySeatIndex;
  const isLastChooser = currentTurnIndex === (roundNumber + 3) % 4;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const remainingSeconds = useMemo(() => {
    const elapsed = Math.max(0, now - startedAt);
    return Math.max(0, Math.ceil(timeoutSeconds - elapsed / 1000));
  }, [now, startedAt, timeoutSeconds]);

  const progress = timeoutSeconds === 0
    ? 0
    : Math.max(0, Math.min(1, remainingSeconds / timeoutSeconds));

  return (
    <motion.div
      className="w-full rounded-lg border border-white/10 bg-background-secondary/90 px-2.5 py-2 shadow-xl backdrop-blur-md md:px-3"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-widest text-primary">
            Trump
          </p>
          <p className="truncate text-xs font-semibold text-foreground">
            {isMyTurn ? "Your choice" : `Seat ${currentTurnIndex + 1}`}
          </p>
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/30 text-xs font-bold text-primary">
          {remainingSeconds}
        </div>
      </div>

      <div className="mb-2 h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {Object.values(Suite).map((suite) => (
          <button
            key={suite}
            type="button"
            disabled={!isMyTurn}
            onClick={() => onChoose(suite)}
            className={`flex h-10 flex-col items-center justify-center rounded-md border bg-white/5 text-center transition disabled:cursor-default disabled:opacity-40 md:h-11 ${suiteTone(suite)}`}
            title={SUITE_NAMES[suite]}
          >
            <span className="text-base leading-none md:text-lg">{SUITE_SYMBOLS[suite]}</span>
            <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wide md:text-[9px]">
              {SUITE_NAMES[suite]}
            </span>
          </button>
        ))}
      </div>

      {isMyTurn && !isLastChooser && (
        <Button
          type="button"
          variant="ghostPrimary"
          className="mt-2 h-8 w-full gap-2 py-1 text-xs"
          onClick={onPass}
        >
          <CircleChevronRight className="h-4 w-4" />
          Next
        </Button>
      )}
    </motion.div>
  );
}
