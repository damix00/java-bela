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
      className="w-full max-w-[34rem] rounded-lg border border-white/10 bg-background-secondary/90 px-3 py-3 shadow-xl backdrop-blur-md md:px-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Trump
          </p>
          <p className="truncate text-sm font-semibold text-foreground">
            {isMyTurn ? "Your choice" : `Seat ${currentTurnIndex + 1}`}
          </p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-primary/30 text-sm font-bold text-primary">
          {remainingSeconds}
        </div>
      </div>

      <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {Object.values(Suite).map((suite) => (
          <button
            key={suite}
            type="button"
            disabled={!isMyTurn}
            onClick={() => onChoose(suite)}
            className={`flex h-14 flex-col items-center justify-center rounded-md border bg-white/5 text-center transition disabled:cursor-default disabled:opacity-40 ${suiteTone(suite)}`}
            title={SUITE_NAMES[suite]}
          >
            <span className="text-xl leading-none">{SUITE_SYMBOLS[suite]}</span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-wide">
              {SUITE_NAMES[suite]}
            </span>
          </button>
        ))}
      </div>

      {isMyTurn && !isLastChooser && (
        <Button
          type="button"
          variant="ghostPrimary"
          className="mt-3 w-full gap-2"
          onClick={onPass}
        >
          <CircleChevronRight className="h-4 w-4" />
          Next
        </Button>
      )}
    </motion.div>
  );
}
