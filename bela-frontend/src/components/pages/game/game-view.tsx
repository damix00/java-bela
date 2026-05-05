"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { toast } from "sonner";
import { useCallback, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useGame } from "@/context/game-context";
import { Card, Declaration, getCardKey, getPlayersInSeatOrder, RoundStatus } from "@/types/game";
import { getLegalMoveCardKeys } from "@/lib/game-rules";
import Loader from "@/components/ui/loader";
import ScoreBoard from "./score-board";
import TrumpDisplay from "./trump-display";
import PlayerSeat from "./player-seat";
import PlayerHand from "./player-hand";
import CenterTrick from "./center-trick";
import GameCountdown from "./game-countdown";
import RoundStartOverlay from "./round-start-overlay";
import TrumpChooser from "./trump-chooser";
import TurnTimeout from "./turn-timeout";
import NextTrickIndicator from "./next-trick-indicator";
import DeclarationRevealOverlay from "./declaration-reveal-overlay";

export default function GameView() {
  const {
    game,
    phase,
    trumpChoice,
    turnTimer,
    nextTrickPending,
    chooseTrump,
    passTrump,
    throwCard,
  } = useGame();
  const { user } = useAuth();
  const trickDropRef = useRef<HTMLDivElement | null>(null);
  const [tableState, setTableState] = useState<{
    trickKey: string;
    previewCard: Card | null;
    isDraggingCard: boolean;
  }>({
    trickKey: "",
    previewCard: null,
    isDraggingCard: false,
  });

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

    const activeRound = game.currentRound;
    const includeRoundPoints =
      activeRound !== null && activeRound.roundStatus !== RoundStatus.FINISHED;
    const team1Score =
      game.team1.totalScore +
      (includeRoundPoints ? activeRound.team1RoundPoints : 0);
    const team2Score =
      game.team2.totalScore +
      (includeRoundPoints ? activeRound.team2RoundPoints : 0);
    const myTeamIndex = bottomPlayer.teamIndex;
    const we = myTeamIndex === 0 ? team1Score : team2Score;
    const they = myTeamIndex === 0 ? team2Score : team1Score;
    return { team1Score: we, team2Score: they };
  }, [game, bottomPlayer]);

  const declarations = useMemo<Declaration[]>(() => {
    const round = game?.currentRound;
    if (!round) return [];

    return [
      ...(round.team1Declarations ?? []),
      ...(round.team2Declarations ?? []),
    ];
  }, [game?.currentRound]);

  const getDeclarationPlayerLabel = useCallback(
    (playerIndex: number) => {
      if (playerIndex === bottomPlayer?.seatIndex) return "You";
      if (playerIndex === topPlayer?.seatIndex) return "Partner";
      if (playerIndex === leftPlayer?.seatIndex) return "Left player";
      if (playerIndex === rightPlayer?.seatIndex) return "Right player";
      return `Seat ${playerIndex + 1}`;
    },
    [bottomPlayer, leftPlayer, rightPlayer, topPlayer],
  );

  // Current turn check
  const currentTurnSeatIndex = game?.currentRound?.currentTurnIndex ?? -1;
  const isChoosingTrump =
    game?.currentRound?.roundStatus === RoundStatus.CHOOSING_TRUMP &&
    trumpChoice !== null;
  const isPlayingCards = game?.currentRound?.roundStatus === RoundStatus.PLAYING;

  const trumpSuite = game?.currentRound?.trumpSuite ?? null;
  const currentTrick = game?.currentRound?.currentTrick ?? null;
  const playedCards = currentTrick?.playedCards ?? [];
  const legalMoveCardKeys = useMemo(
    () =>
      bottomPlayer
        ? getLegalMoveCardKeys(currentTrick, trumpSuite, bottomPlayer.hand ?? [])
        : new Set<string>(),
    [bottomPlayer, currentTrick, trumpSuite],
  );
  const tableStateKey = `${game?.currentRound?.roundNumber ?? -1}-${game?.currentRound?.currentTrickNumber ?? -1}`;
  const previewCard =
    tableState.trickKey === tableStateKey ? tableState.previewCard : null;
  const isDraggingCard =
    tableState.trickKey === tableStateKey ? tableState.isDraggingCard : false;
  const activePreviewCard =
    previewCard &&
    playedCards.some(
      (playedCard) =>
        playedCard.playerIndex === bottomPlayer?.seatIndex &&
        getCardKey(playedCard.card) === getCardKey(previewCard),
    )
      ? null
      : previewCard;
  const previewCardKey = activePreviewCard ? getCardKey(activePreviewCard) : null;
  const nextTrickWinningLabel =
    nextTrickPending?.winningPlayerIndex === bottomPlayer?.seatIndex
      ? "You"
      : nextTrickPending?.winningPlayerIndex != null
        ? `Seat ${nextTrickPending.winningPlayerIndex + 1}`
        : "Winner";
  const nextRoundNumber = (nextTrickPending?.roundNumber ?? 0) + 2;

  const handleThrowCard = useCallback(
    (card: Card, _index: number, source: "click" | "drag") => {
      if (!legalMoveCardKeys.has(getCardKey(card))) {
        toast.error("Invalid move", {
          description: "You need to play a legal card for this trick.",
          id: "invalid-card-move",
        });
        return;
      }

      setTableState({
        trickKey: tableStateKey,
        previewCard: source === "click" ? card : null,
        isDraggingCard: false,
      });
      throwCard(card);
    },
    [legalMoveCardKeys, tableStateKey, throwCard],
  );

  const handleInvalidCardClick = useCallback(() => {
    toast.error("Invalid move", {
      description: "You need to play a legal card for this trick.",
      id: "invalid-card-move",
    });
  }, []);

  const handleDraggingChange = useCallback(
    (dragging: boolean) => {
      setTableState((current) => {
        const nextPreviewCard =
          current.trickKey === tableStateKey ? current.previewCard : null;
        const nextState = {
          trickKey: tableStateKey,
          previewCard: nextPreviewCard,
          isDraggingCard: dragging,
        };

        return current.trickKey === nextState.trickKey &&
          current.previewCard === nextState.previewCard &&
          current.isDraggingCard === nextState.isDraggingCard
          ? current
          : nextState;
      });
    },
    [tableStateKey],
  );

  // Loading state
  if (!game || phase === "loading") {
    return (
      <div className="flex h-dvh w-full items-center justify-center overflow-hidden bg-background">
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
    <div className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-background pb-[env(safe-area-inset-bottom)] select-none">
      {/* Overlays */}
      <AnimatePresence>
        {phase === "countdown" && <GameCountdown key="countdown" />}
        {phase === "round_starting" && <RoundStartOverlay key="round" />}
        {phase === "declarations" && declarations.length > 0 && (
          <DeclarationRevealOverlay
            key="declarations"
            declarations={declarations}
            getPlayerLabel={getDeclarationPlayerLabel}
          />
        )}
      </AnimatePresence>

      {/* Top bar: Score + Trump */}
      <div className="relative z-10 flex items-start justify-between gap-3 p-3 md:p-6">
        <ScoreBoard team1Score={team1Score} team2Score={team2Score} />
        <TrumpDisplay suite={trumpSuite} />
      </div>

      <div className="absolute left-1/2 top-3 z-30 w-[min(30rem,calc(100%-1rem))] -translate-x-1/2 md:top-4">
        <AnimatePresence mode="wait">
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

          {bottomPlayer && !isChoosingTrump && nextTrickPending && (
            <NextTrickIndicator
              key={`${nextTrickPending.kind}-${nextTrickPending.roundNumber}-${nextTrickPending.completedTrickNumber}-${nextTrickPending.startedAt}`}
              title={
                nextTrickPending.kind === "round"
                  ? "Round Complete"
                  : "Trick Complete"
              }
              message={
                nextTrickPending.kind === "round"
                  ? `Round ${nextRoundNumber} starts next`
                  : `${nextTrickWinningLabel} starts next`
              }
              timeoutSeconds={nextTrickPending.timeoutSeconds}
              startedAt={nextTrickPending.startedAt}
            />
          )}

          {bottomPlayer && !isChoosingTrump && !nextTrickPending && turnTimer && (
            <TurnTimeout
              key={`${turnTimer.roundNumber}-${turnTimer.trickNumber}-${turnTimer.currentTurnIndex}-${turnTimer.startedAt}`}
              label={
                turnTimer.currentTurnIndex === bottomPlayer.seatIndex
                  ? "Throw your card"
                  : `Seat ${turnTimer.currentTurnIndex + 1} is up`
              }
              timeoutSeconds={turnTimer.timeoutSeconds}
              startedAt={turnTimer.startedAt}
              isMyTurn={turnTimer.currentTurnIndex === bottomPlayer.seatIndex}
            />
          )}
        </AnimatePresence>
      </div>

      <LayoutGroup id="game-table">
        {/* Game table area */}
        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-12 py-4 md:px-20 md:py-6">
          {/* Subtle table felt effect */}
          <div className="absolute inset-0 bg-gradient-radial from-background-secondary/30 via-transparent to-transparent pointer-events-none" />

          {/* Top player (partner) */}
          <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 md:top-4">
            {topPlayer && (
              <PlayerSeat
                player={topPlayer}
                position="top"
                isCurrentTurn={topPlayer.seatIndex === currentTurnSeatIndex}
              />
            )}
          </div>

          {/* Left player */}
          <div className="absolute left-1 top-1/2 z-10 -translate-y-1/2 md:left-8">
            {leftPlayer && (
              <PlayerSeat
                player={leftPlayer}
                position="left"
                isCurrentTurn={leftPlayer.seatIndex === currentTurnSeatIndex}
              />
            )}
          </div>

          {/* Right player */}
          <div className="absolute right-1 top-1/2 z-10 -translate-y-1/2 md:right-8">
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
            dropTargetRef={trickDropRef}
            previewCard={activePreviewCard}
            previewPlayerIndex={bottomPlayer?.seatIndex ?? null}
            isDropTargetActive={isDraggingCard}
            playedCards={playedCards}
            playerSeatMapping={seatMapping}
          />
        </div>

      {/* Bottom: current player's hand */}
      <div className="relative z-10 flex shrink-0 flex-col items-center gap-1 pb-3 pt-1 md:gap-2 md:pb-5 md:pt-1">
        {/* Bottom player info */}
        {bottomPlayer && (
          <PlayerSeat
            player={bottomPlayer}
            position="bottom"
            isCurrentTurn={bottomPlayer.seatIndex === currentTurnSeatIndex}
          />
        )}

        {/* Hand */}
        {bottomPlayer && (
          <PlayerHand
            cards={bottomPlayer.hand ?? []}
            interactive={
              isPlayingCards &&
              !isChoosingTrump &&
              !nextTrickPending &&
              bottomPlayer.seatIndex === currentTurnSeatIndex
            }
            pendingCardKey={previewCardKey}
            legalCardKeys={legalMoveCardKeys}
            dropTargetRef={trickDropRef}
            onDraggingChange={handleDraggingChange}
            onCardThrow={handleThrowCard}
            onInvalidCardClick={handleInvalidCardClick}
          />
        )}
      </div>
      </LayoutGroup>
    </div>
  );
}
