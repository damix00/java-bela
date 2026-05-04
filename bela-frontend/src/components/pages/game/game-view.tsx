"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useGame } from "@/context/game-context";
import { getPlayersInSeatOrder, RoundStatus } from "@/types/game";
import Loader from "@/components/ui/loader";
import ScoreBoard from "./score-board";
import TrumpDisplay from "./trump-display";
import PlayerSeat from "./player-seat";
import PlayerHand from "./player-hand";
import CenterTrick from "./center-trick";
import GameCountdown from "./game-countdown";
import RoundStartOverlay from "./round-start-overlay";
import TrumpChooser from "./trump-chooser";

export default function GameView() {
  const { game, phase, trumpChoice, chooseTrump, passTrump } = useGame();
  const { user } = useAuth();

  // Map seat indices to visual positions relative to current user
  // Visual: 0=top (partner), 1=right, 2=bottom (me), 3=left
  const { topPlayer, rightPlayer, bottomPlayer, leftPlayer, seatMapping } =
    useMemo(() => {
      if (!game || !user)
        return {
          topPlayer: null,
          rightPlayer: null,
          bottomPlayer: null,
          leftPlayer: null,
          seatMapping: {} as Record<number, number>,
        };

      const players = getPlayersInSeatOrder(game);
      const myIndex = players.findIndex((p) => p?.userId === user.id);
      if (myIndex === -1 || players.some((player) => !player)) {
        return {
          topPlayer: null,
          rightPlayer: null,
          bottomPlayer: null,
          leftPlayer: null,
          seatMapping: {} as Record<number, number>,
        };
      }

      // Rotate so current user is always at bottom (visual position 2)
      // Order: bottom(me), right, top(partner), left
      const rotated = [
        players[myIndex], // bottom
        players[(myIndex + 1) % 4], // right
        players[(myIndex + 2) % 4], // top (partner)
        players[(myIndex + 3) % 4], // left
      ];

      // Build mapping: backend seatIndex → visual position
      const mapping: Record<number, number> = {};
      mapping[rotated[0].seatIndex] = 2; // bottom
      mapping[rotated[1].seatIndex] = 1; // right
      mapping[rotated[2].seatIndex] = 0; // top
      mapping[rotated[3].seatIndex] = 3; // left

      return {
        bottomPlayer: rotated[0],
        rightPlayer: rotated[1],
        topPlayer: rotated[2],
        leftPlayer: rotated[3],
        seatMapping: mapping,
      };
    }, [game, user]);

  // Determine which team the current user is on for "WE" label
  const { team1Score, team2Score } = useMemo(() => {
    if (!game || !bottomPlayer)
      return { team1Score: 0, team2Score: 0 };

    const myTeamIndex = bottomPlayer.teamIndex;
    const we = myTeamIndex === 0 ? game.team1.totalScore : game.team2.totalScore;
    const they = myTeamIndex === 0 ? game.team2.totalScore : game.team1.totalScore;
    return { team1Score: we, team2Score: they };
  }, [game, bottomPlayer]);

  // Current turn check
  const currentTurnSeatIndex = game?.currentRound?.currentTurnIndex ?? -1;
  const isChoosingTrump =
    game?.currentRound?.roundStatus === RoundStatus.CHOOSING_TRUMP &&
    trumpChoice !== null;

  const trumpSuite = game?.currentRound?.trumpSuite ?? null;
  const playedCards = game?.currentRound?.currentTrick?.playedCards ?? [];

  // Loading state
  if (!game || phase === "loading") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader />
          <motion.p
            className="text-sm text-foreground-muted uppercase tracking-widest"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Waiting for players...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background overflow-hidden select-none">
      {/* Overlays */}
      <AnimatePresence>
        {phase === "countdown" && <GameCountdown key="countdown" />}
        {phase === "round_starting" && <RoundStartOverlay key="round" />}
      </AnimatePresence>

      {/* Top bar: Score + Trump */}
      <div className="relative z-10 flex items-start justify-between p-4 md:p-6">
        <ScoreBoard team1Score={team1Score} team2Score={team2Score} />
        <TrumpDisplay suite={trumpSuite} />
      </div>

      {/* Game table area */}
      <div className="flex flex-1 flex-col items-center justify-center relative">
        {/* Subtle table felt effect */}
        <div className="absolute inset-0 bg-gradient-radial from-background-secondary/30 via-transparent to-transparent pointer-events-none" />

        {/* Top player (partner) */}
        <div className="absolute top-2 md:top-4 left-1/2 -translate-x-1/2 z-10">
          {topPlayer && (
            <PlayerSeat
              player={topPlayer}
              position="top"
              isCurrentTurn={topPlayer.seatIndex === currentTurnSeatIndex}
            />
          )}
        </div>

        {/* Left player */}
        <div className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 z-10">
          {leftPlayer && (
            <PlayerSeat
              player={leftPlayer}
              position="left"
              isCurrentTurn={leftPlayer.seatIndex === currentTurnSeatIndex}
            />
          )}
        </div>

        {/* Right player */}
        <div className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 z-10">
          {rightPlayer && (
            <PlayerSeat
              player={rightPlayer}
              position="right"
              isCurrentTurn={rightPlayer.seatIndex === currentTurnSeatIndex}
            />
          )}
        </div>

        {/* Center trick area */}
        <CenterTrick
          playedCards={playedCards}
          playerSeatMapping={seatMapping}
        />
      </div>

      {/* Bottom: current player's hand */}
      <div className="relative z-10 pb-6 pt-2 md:pb-8 flex flex-col items-center gap-2">
        {/* Bottom player info */}
        {bottomPlayer && (
          <PlayerSeat
            player={bottomPlayer}
            position="bottom"
            isCurrentTurn={bottomPlayer.seatIndex === currentTurnSeatIndex}
          />
        )}

        <AnimatePresence>
          {bottomPlayer && isChoosingTrump && trumpChoice && (
            <TrumpChooser
              key="trump-chooser"
              currentTurnIndex={trumpChoice.currentTurnIndex}
              mySeatIndex={bottomPlayer.seatIndex}
              roundNumber={trumpChoice.roundNumber}
              timeoutSeconds={trumpChoice.timeoutSeconds}
              startedAt={trumpChoice.startedAt}
              onChoose={chooseTrump}
              onPass={passTrump}
            />
          )}
        </AnimatePresence>

        {/* Hand */}
        {bottomPlayer && (
          <PlayerHand
            cards={bottomPlayer.hand ?? []}
            interactive={
              !isChoosingTrump && bottomPlayer.seatIndex === currentTurnSeatIndex
            }
            onCardClick={(card, index) => {
              // TODO: send play card event to backend
              console.log("Card clicked:", card, index);
            }}
          />
        )}
      </div>
    </div>
  );
}
