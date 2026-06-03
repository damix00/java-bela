"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useGame } from "@/context/game-context";
import { getPlayersInSeatOrder } from "@/types/game";
import Button from "@/components/input/button";

export default function GameOverOverlay() {
  const { game, phase, gameResult } = useGame();
  const { user } = useAuth();

  const myTeamIndex = useMemo(() => {
    if (!game || !user) return null;

    const players = getPlayersInSeatOrder(game);
    const me = players.find((player) => player?.userId === user.id);
    if (!me) return null;

    return me.seatIndex % 2;
  }, [game, user]);

  if (phase !== "finished" || !gameResult || myTeamIndex === null) return null;

  const didWin = gameResult.winningTeamIndex === myTeamIndex;
  const myScore =
    myTeamIndex === 0
      ? gameResult.team1FinalScore
      : gameResult.team2FinalScore;
  const theirScore =
    myTeamIndex === 0
      ? gameResult.team2FinalScore
      : gameResult.team1FinalScore;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ scale: 0.5, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 1.5, opacity: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <motion.div
          className="w-32 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        />

        <motion.span
          className="text-sm uppercase tracking-[0.4em] text-foreground-muted font-bold"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Game Over
        </motion.span>

        <motion.span
          className="text-6xl md:text-8xl font-heading font-black leading-none"
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 12,
            delay: 0.15,
          }}
          style={{
            color: didWin ? "var(--color-primary)" : undefined,
            textShadow: didWin ? "0 0 40px rgba(197,255,139,0.4)" : undefined,
          }}
        >
          {didWin ? "Victory" : "Defeat"}
        </motion.span>

        <motion.div
          className="flex items-end gap-6 text-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-[0.3em] text-foreground-muted">
              We
            </span>
            <span className="text-4xl md:text-5xl font-heading font-black">
              {myScore}
            </span>
          </div>
          <span className="pb-2 text-2xl text-foreground-muted">—</span>
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-[0.3em] text-foreground-muted">
              Them
            </span>
            <span className="text-4xl md:text-5xl font-heading font-black">
              {theirScore}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Button
            variant="filled"
            size="lg"
            onClick={() => (window.location.href = "/home")}
          >
            Back to Home
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
