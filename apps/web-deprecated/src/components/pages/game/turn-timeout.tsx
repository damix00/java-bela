"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";

export default function TurnTimeout({
  label,
  timeoutSeconds,
  startedAt,
  isMyTurn,
}: {
  label: string;
  timeoutSeconds: number;
  startedAt: number;
  isMyTurn: boolean;
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
    const nextRemainingSeconds = Math.max(
      0,
      Math.ceil(timeoutSeconds - elapsedSeconds),
    );

    return {
      remainingSeconds: nextRemainingSeconds,
      progress:
        timeoutSeconds <= 0
          ? 0
          : Math.max(0, Math.min(1, 1 - elapsedSeconds / timeoutSeconds)),
    };
  }, [now, startedAt, timeoutSeconds]);

  const urgent = progress <= 0.35;

  return (
    <motion.div
      className="pointer-events-none relative w-full overflow-hidden rounded-lg border border-white/10 bg-background-secondary/82 px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.2)] backdrop-blur-md"
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        boxShadow: urgent
          ? "0 12px 30px rgba(220, 38, 38, 0.14)"
          : "0 12px 30px rgba(0,0,0,0.2)",
      }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 250, damping: 24 }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: urgent ? [0.1, 0.22, 0.1] : 0.08,
        }}
        transition={{
          duration: urgent ? 0.8 : 2.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: urgent
            ? "radial-gradient(circle at top, rgba(248,113,113,0.28), transparent 58%)"
            : "radial-gradient(circle at top, rgba(197,255,139,0.18), transparent 62%)",
        }}
      />

      <div className="relative flex items-center gap-2.5">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="3.5"
            />
            <motion.circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke={urgent ? "rgba(248,113,113,0.95)" : "rgba(197,255,139,0.95)"}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={113.1}
              animate={{ strokeDashoffset: 113.1 * (1 - progress) }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </svg>
          <motion.span
            className={`absolute text-xs font-black tabular-nums ${
              urgent ? "text-red-300" : "text-primary"
            }`}
            animate={urgent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{
              duration: 0.45,
              repeat: urgent ? Infinity : 0,
              ease: "easeInOut",
            }}
          >
            {remainingSeconds}
          </motion.span>
        </div>

        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-foreground-muted">
            Turn Timer
          </p>
          <p className="truncate text-xs font-semibold text-foreground">
            {label}
          </p>
        </div>

        <div className="ml-auto hidden min-w-[3.75rem] justify-end md:flex">
          <span
            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] ${
              isMyTurn
                ? "border-primary/35 bg-primary/10 text-primary"
                : "border-white/10 bg-white/5 text-foreground-muted"
            }`}
          >
            {isMyTurn ? "Your Turn" : "Live"}
          </span>
        </div>
      </div>

      <div className="relative mt-2 h-1 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className={`h-full rounded-full ${
            urgent ? "bg-red-400" : "bg-primary"
          }`}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}
