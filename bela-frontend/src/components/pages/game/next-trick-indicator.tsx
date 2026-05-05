"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";

export default function NextTrickIndicator({
  title,
  message,
  timeoutSeconds,
  startedAt,
}: {
  title: string;
  message: string;
  timeoutSeconds: number;
  startedAt: number;
}) {
  const [now, setNow] = useState(startedAt);

  useEffect(() => {
    setNow(startedAt);
  }, [startedAt]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, []);

  const { remainingSeconds, progress } = useMemo(() => {
    const elapsedMs = Math.max(0, now - startedAt);
    const elapsedSeconds = elapsedMs / 1000;

    return {
      remainingSeconds: Math.max(0, Math.ceil(timeoutSeconds - elapsedSeconds)),
      progress:
        timeoutSeconds <= 0
          ? 0
          : Math.max(0, Math.min(1, elapsedSeconds / timeoutSeconds)),
    };
  }, [now, startedAt, timeoutSeconds]);

  return (
    <motion.div
      className="pointer-events-none relative w-full max-w-sm overflow-hidden rounded-2xl border border-primary/20 bg-background-secondary/82 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.24)] backdrop-blur-md"
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(circle at top, rgba(197,255,139,0.18), transparent 64%)",
        }}
      />

      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-sm font-black tabular-nums text-primary">
          {remainingSeconds}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground-muted">
            {title}
          </p>
          <p className="truncate text-sm font-semibold text-foreground">
            {message}
          </p>
        </div>
      </div>

      <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}
