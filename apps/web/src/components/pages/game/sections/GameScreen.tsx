"use client";

import { LogOut } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    RoundStatus,
    type Card,
    type Declaration,
    type Suite,
} from "@bela/protocol";

import type { User } from "@/api/types/user";
import BelaPrompt from "@/components/pages/game/blocks/controls/BelaPrompt";
import DeclarationsPanel from "@/components/pages/game/blocks/controls/DeclarationsPanel";
import DeclarationsDialog from "@/components/pages/game/blocks/status/DeclarationsDialog";
import TrumpChooser from "@/components/pages/game/blocks/controls/TrumpChooser";
import HandFan from "@/components/pages/game/blocks/cards/HandFan";
import CardFlightLayer, {
    type CardFlight,
} from "@/components/pages/game/blocks/cards/CardFlightLayer";
import type { CardOrigin } from "@/components/pages/game/blocks/cards/PlayingCard";
import GameSeat from "@/components/pages/game/blocks/table/GameSeat";
import GameTableStage from "@/components/pages/game/blocks/table/GameTableStage";
import TrickPile, {
    playedCardRotation,
} from "@/components/pages/game/blocks/table/TrickPile";
import GameOverPanel from "@/components/pages/game/blocks/status/GameOverPanel";
import LeaveMatchDialog from "@/components/pages/game/blocks/status/LeaveMatchDialog";
import DealCountdown from "@/components/pages/game/blocks/status/DealCountdown";
import ScoreBoard from "@/components/pages/game/blocks/status/ScoreBoard";
import TurnTimer from "@/components/pages/game/blocks/status/TurnTimer";
import BelaAnnouncement from "@/components/pages/game/blocks/status/BelaAnnouncement";
import {
    useGame,
    useGameActions,
    type GamePhase,
    type RoundView,
} from "@/context/game-context";
import { SNAPSHOT_GRACE_MS, useLobbyActions } from "@/context/lobby-context";
import { useSocketStatus } from "@/context/socket-context";
import { useSocketErrors, useSocketEvent } from "@/hooks/use-socket-event";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/ui/cn";
import {
    canDeclareBela,
    cardKey,
    declarationPoints,
    sameCard,
} from "@/lib/game/rules";
import type { Locale } from "@/lib/i18n/config";
import { homePath } from "@/lib/navigation/routes";
import {
    appGutters,
    focusRing,
    panel,
    panelRaised,
    popEnterFrom,
    popEnterTo,
    popExitTo,
    popTransition,
} from "@/lib/ui/styles";

/* The screen's own frame: the viewport, safe areas included, at every size —
   the play route's wrapper is `h-dvh overflow-hidden`, so anything this lays out
   past the bottom edge is not scrolled to, it is simply gone. A wide window that
   is short (a laptop with a browser's chrome in it) is the case that used to lose
   the hand. The rows that can't give — score, hand, timer — keep their size and
   the felt takes what is left, so the padding and gaps only ease off with the
   height rather than stepping at a breakpoint. */
const screenClass = [
    "flex h-full min-h-0 flex-auto flex-col gap-2 overflow-hidden",
    "pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]",
    "pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]",
    // A shorter phone gives the fixed furniture less and the table more.
    "portrait-sm:gap-1.5",
    "flat:gap-1 flat:pt-[max(0.375rem,env(safe-area-inset-top))] flat:pb-[max(0.375rem,env(safe-area-inset-bottom))]",
    "desk:justify-center desk:gap-[clamp(0.375rem,1.5vh,1rem)] desk:px-8 desk:py-[clamp(0.5rem,2.5vh,1.5rem)]",
    "desk-md:px-28 desk-lg:px-48 desk-xl:px-72",
].join(" ");

/* The score sits over the screen rather than in its flow, so the table keeps
   the height. `scoreSpacerClass` is what reserves the row it covers. */
const scoreDockClass = [
    // Only the board's height is reserved by `scoreSpacerClass`, so the leave
    // control below it overlays the felt rather than taking a row from the
    // table. Its inner column is constrained to the board's width: aligning it
    // to this viewport-wide dock put the control adrift at the screen edge.
    "pointer-events-none fixed z-30 flex flex-col gap-2 desk:gap-2.5",
    "top-[max(0.75rem,env(safe-area-inset-top))]",
    "left-[max(0.75rem,env(safe-area-inset-left))] right-[max(0.75rem,env(safe-area-inset-right))]",
    "flat:top-[max(0.375rem,env(safe-area-inset-top))]",
    "desk:top-6 desk:left-8 desk:right-8",
    "desk-md:left-28 desk-md:right-28",
    "desk-lg:left-48 desk-lg:right-48",
    "desk-xl:left-72 desk-xl:right-72",
].join(" ");

const scoreDockContentClass =
    "mx-auto flex w-full max-w-[560px] flex-col gap-2 sm:gap-2.5 lg:max-w-[1000px]";

/* Laid flat, the table is the only thing with no room to spare, so every row
   that is not the table gives up what it can — this one included. */
const scoreSpacerClass = [
    "w-full h-20 flex-[0_0_5rem]",
    "portrait-sm:h-18 portrait-sm:flex-[0_0_4.5rem]",
    "flat:h-14 flat:flex-[0_0_3.5rem]",
    "desk:h-22 desk:flex-[0_0_5.5rem]",
].join(" ");

const playAreaClass = [
    "flex w-full min-h-0 flex-auto items-stretch mt-2",
    "portrait-sm:mt-1",
    "flat:mt-0",
    "desk:items-center desk:mt-[clamp(0.25rem,1.5vh,1rem)]",
].join(" ");

/* On the desktop table the timer sits above the hand; on a phone it sits under
   it, where the thumb is not covering it. */
const timerAreaClass = "flex flex-none flex-col gap-1 desk:order-1";

/* Whose move it is, in words, directly over the hand.
 *
 * The table used to say this in two places that have both gone: the near seat's
 * ring, and the empty middle's own label — which only ever showed before the
 * first card of a trick was down. This is the one that is always there. It
 * takes `desk:order-1` so it stays with the timer above the hand on a roomy
 * screen, and sits under the hand with it on a phone. */
const turnNoticeClass =
    "flex min-h-6 flex-none items-center justify-center desk:order-1 flat:min-h-5";

/** How long the result stays up before the table shows itself out. */
const GAME_OVER_DWELL_MS = 3000;
const handAreaClass = "flex flex-none justify-center desk:order-2";

function flightKey(playerIndex: number, card: Card) {
    return `${playerIndex}-${cardKey(card)}`;
}

function remoteCardOrigin(
    root: HTMLElement,
    playerIndex: number,
): CardOrigin | null {
    const anchor = root.querySelector<HTMLElement>(
        `[data-card-origin="${playerIndex}"]`,
    );
    if (!anchor) return null;

    const anchorRect = anchor.getBoundingClientRect();
    const destination = root.querySelector<HTMLElement>(
        `[data-card-destination="${playerIndex}"]`,
    );
    const destinationRect = destination?.getBoundingClientRect();
    const width = destinationRect?.width || 56;
    const height = destinationRect?.height || width * (585 / 363);

    return {
        left: anchorRect.left + (anchorRect.width - width) / 2,
        top: anchorRect.top + (anchorRect.height - height) / 2,
        width,
        height,
    };
}

function flightRotation(
    playerIndex: number,
    order: [number, number, number, number],
) {
    const [near, left, across, right] = order;
    if (playerIndex === left) return -5;
    if (playerIndex === right) return 5;
    if (playerIndex === across) return 2;
    if (playerIndex === near) return -2;
    return 0;
}

/* Decisions float above the felt instead of claiming a row in the game screen.
   A round changing from cards to declarations therefore cannot push the table,
   hand, or timer to a different position. */
const actionOverlayClass = [
    "pointer-events-none fixed left-1/2 z-40 grid w-[calc(100vw-max(1rem,calc(env(safe-area-inset-left)+env(safe-area-inset-right))))] -translate-x-1/2 place-items-center",
    "top-[max(6.5rem,calc(env(safe-area-inset-top)+5.75rem))] bottom-[max(7.5rem,calc(env(safe-area-inset-bottom)+6.75rem))]",
    "flat:top-[max(4.5rem,calc(env(safe-area-inset-top)+4rem))] flat:bottom-[max(5rem,calc(env(safe-area-inset-bottom)+4.5rem))]",
    "desk:w-[min(44rem,calc(100vw-4rem))] desk:top-[max(7rem,calc(env(safe-area-inset-top)+6rem))] desk:bottom-8",
].join(" ");

type GameScreenProps = {
    copy: Dictionary["game"];
    /** Reused from the lobby rather than duplicated into the game's own copy. */
    gameId: string;
    locale: Locale;
    /**
     * Read on the server, like `TableScreen` takes it and for the same reason:
     * `useAuth` is a pass behind after hydration, and the snapshot that names
     * your seat can land inside that window.
     */
    user: User;
};

/**
 * The table, once the cards are out.
 *
 * Everything on screen is the server's account of the game — `GameProvider` holds
 * the folded `game:*` stream and this only arranges it. The one piece of local
 * state is the bela question, which has to be answered before the card it is
 * about leaves the hand.
 *
 * The chairs keep the lobby's near/left/across/right order. On phones the game
 * opens that arrangement up to the viewport, because a hand of cards and the
 * current decision are more important than preserving the lobby's fixed grid.
 */
export default function GameScreen({
    copy,
    gameId,
    locale,
    user,
}: GameScreenProps) {
    const {
        game,
        phase,
        seating,
        chair,
        isMyTurn,
        trumpCountdown,
        declaringCountdown,
        declarationCountdown,
        turnCountdown,
        pendingBreak,
        canPass,
        result,
    } = useGame();
    const {
        ready,
        chooseTrump,
        passTrump,
        throwCard,
        declareDeclarations,
        declineDeclarations,
        leaveGame,
    } = useGameActions();
    const { forget } = useLobbyActions();
    const status = useSocketStatus();
    const router = useRouter();
    const reduceMotion = useReducedMotion();
    const screenRef = useRef<HTMLElement>(null);
    const nextFlightId = useRef(0);
    const [flights, setFlights] = useState<CardFlight[]>([]);
    const [flightConnection, setFlightConnection] = useState({
        status,
        epoch: 0,
    });

    if (flightConnection.status !== status) {
        setFlightConnection({
            status,
            epoch: flightConnection.epoch + (status === "connected" ? 0 : 1),
        });
    }

    const connectionEpoch = flightConnection.epoch;

    /** The card waiting on a bela answer. Cleared as soon as it is thrown. */
    const [belaCard, setBelaCard] = useState<{
        card: Card;
        origin: CardOrigin;
    } | null>(null);
    const [belaAnnouncement, setBelaAnnouncement] = useState<{
        key: string;
        playerIndex: number;
        /** The trump king or queen it was called on, so the toast can show the pair. */
        card: Card;
    } | null>(null);

    useEffect(() => {
        if (!belaAnnouncement) return;

        const timeout = window.setTimeout(() => setBelaAnnouncement(null), 2400);
        return () => window.clearTimeout(timeout);
    }, [belaAnnouncement]);

    /** Which side of the score has been tapped for its declarations. */
    const [showDeclarations, setShowDeclarations] = useState<
        "us" | "them" | null
    >(null);

    /** Whether the leave button has been pressed and is waiting on an answer. */
    const [confirmingLeave, setConfirmingLeave] = useState(false);

    /**
     * Walking out of a hand, which is three separate things.
     *
     * `game:leave` on a game still in progress is an abandonment: the backend
     * drops it, hands the other three back to their tables, and takes this
     * player's seat. The lobby is then cleared *locally* — no `lobby:leave`
     * behind it, which would be a second command racing that cleanup — because
     * the snapshot we are still holding says IN_GAME, and `TableScreen` reads
     * that as "you belong at a table" and would send us straight back to the
     * game we just left.
     *
     * The navigation is `replace`: the table that is being abandoned is not
     * somewhere Back should be able to return to. `TableScreen` mounts fresh on
     * the other side of it — this screen unmounts, so its one-attempt-per-session
     * ref is new — and opens a table with nothing in it.
     */
    const leaveMatch = () => {
        leaveGame();
        forget();
        router.replace(homePath(locale));
    };

    // The "I am on the game screen" handshake. The fourth one deals the first
    // round. Safe to repeat — `GameLifecycleService.onLoaded` returns early
    // unless the game is still WAITING — so it is re-sent on every reconnect
    // rather than tracked as a thing that has already happened.
    useEffect(() => {
        if (status !== "connected") return;

        ready();
    }, [status, ready]);

    /**
     * A table that is not there any more.
     *
     * Reached by opening an old `/play/{id}` link, or by the game being dropped
     * while away. The wait is the same one the lobby uses: a reconnect's snapshot
     * arrives unprompted and slightly after the socket opens, so deciding "there
     * is no game" any sooner would race it and lose.
     */
    useEffect(() => {
        if (status !== "connected" || game) return;

        const id = setTimeout(
            () => router.replace(homePath(locale)),
            SNAPSHOT_GRACE_MS * 2,
        );

        return () => clearTimeout(id);
    }, [status, game, router, locale]);

    /**
     * The way out of a finished table, taken for the player.
     *
     * Long enough to read the result, short enough that nobody wonders whether
     * the game is waiting on them — so it is a plain wait, with nothing to press
     * and nothing counting down on screen.
     *
     * Only the leave is sent here. The lobby snapshot it comes back with is what
     * navigates, in `LobbyProvider` — the same place every other "where does this
     * player belong" decision is made. Leaving the screen before the timer fires
     * costs nothing either: the backend treats a reconnect into a finished game
     * as the leave that never arrived.
     */
    useEffect(() => {
        if (phase !== "finished") return;

        const id = setTimeout(leaveGame, GAME_OVER_DWELL_MS);

        return () => clearTimeout(id);
    }, [phase, leaveGame]);

    const roundNumber = game?.round?.roundNumber ?? null;
    const trickNumber = game?.round?.currentTrickNumber ?? null;

    const completeFlight = useCallback((id: number, returning: boolean) => {
        setFlights((current) =>
            current.flatMap((flight) => {
                if (flight.id !== id) return [flight];
                if (returning || flight.confirmed) return [];

                return [{ ...flight, landed: true }];
            }),
        );
    }, []);

    useSocketEvent("game:cardThrown", (data) => {
        const local = data.playerIndex === chair;

        if (data.belaDeclared) {
            setBelaAnnouncement({
                key: `${data.roundNumber}-${data.trickNumber}-${data.playerIndex}`,
                playerIndex: data.playerIndex,
                card: data.card,
            });
        }

        if (local) {
            setFlights((current) => {
                const relevant = current.filter(
                    (flight) =>
                        flight.roundNumber === data.roundNumber &&
                        flight.trickNumber === data.trickNumber &&
                        flight.connectionEpoch === connectionEpoch,
                );

                return relevant.flatMap((flight) => {
                    if (
                        !flight.local ||
                        flight.playerIndex !== data.playerIndex ||
                        !sameCard(flight.card, data.card)
                    ) {
                        return [flight];
                    }

                    return flight.landed
                        ? []
                        : [{ ...flight, confirmed: true }];
                });
            });
            return;
        }

        if (reduceMotion || !game?.round || !seating) return;
        if (game.round.roundNumber !== data.roundNumber) return;
        if (
            game.round.trickCards.some(
                (played) =>
                    played.playerIndex === data.playerIndex &&
                    sameCard(played.card, data.card),
            )
        ) {
            return;
        }

        const root = screenRef.current;
        const source = root ? remoteCardOrigin(root, data.playerIndex) : null;
        if (!source) return;

        const key = flightKey(data.playerIndex, data.card);
        setFlights((current) => {
            const relevant = current.filter(
                (flight) =>
                    flight.roundNumber === data.roundNumber &&
                    flight.trickNumber === data.trickNumber &&
                    flight.connectionEpoch === connectionEpoch,
            );
            if (relevant.some((flight) => flight.key === key)) {
                return relevant;
            }

            return [
                ...relevant,
                {
                    id: nextFlightId.current++,
                    key,
                    card: data.card,
                    playerIndex: data.playerIndex,
                    roundNumber: data.roundNumber,
                    trickNumber: data.trickNumber,
                    connectionEpoch,
                    source,
                    rotation: flightRotation(data.playerIndex, seating.order),
                    landingRotation: playedCardRotation(
                        { playerIndex: data.playerIndex, card: data.card },
                        seating.order[0],
                        data.roundNumber,
                        data.trickNumber,
                    ),
                    local: false,
                    confirmed: true,
                    landed: false,
                    returning: false,
                    reduced: false,
                },
            ];
        });
    });

    useSocketErrors((error) => {
        if (error.command !== "game:card:throw") return;

        setFlights((current) =>
            current.flatMap((flight) => {
                if (
                    flight.roundNumber !== roundNumber ||
                    flight.trickNumber !== trickNumber ||
                    flight.connectionEpoch !== connectionEpoch
                ) {
                    return [];
                }
                if (!flight.local || flight.confirmed) return [flight];
                if (flight.reduced) return [];

                return [{ ...flight, returning: true }];
            }),
        );
    });

    if (!game || !seating) {
        return <Notice className={appGutters}>{copy.loading}</Notice>;
    }

    // Both read straight off the seat: the snapshot carries who is sitting
    // there, bots included, so there is nothing left to look up.
    const nameOf = (seat: number) => {
        const player = seating.bySeat.get(seat);
        if (!player) return copy.trick.waitingFor.replace("{name}", "");
        if (player.userId === user.id) return user.username;

        return player.username ?? "…";
    };

    const avatarOf = (seat: number) => {
        const player = seating.bySeat.get(seat);
        if (!player) return null;
        if (player.userId === user.id) return user.avatarUrl;

        return player.avatarUrl ?? null;
    };

    const round = game.round;
    const trumpSuite = round?.trumpSuite ?? null;
    const [, left, across, right] = seating.order;

    const mineFirst = seating.teamIndex === 1;
    const usTotal = mineFirst ? game.team2.totalScore : game.team1.totalScore;
    const themTotal = mineFirst ? game.team1.totalScore : game.team2.totalScore;
    // What the cards have won, with the zvanja shown beside it rather than folded
    // in: the bar was printing the same 60 twice, once as the round and once as
    // the declarations it was made of.
    const usRound = mineFirst
        ? (round?.team2CardPoints ?? 0)
        : (round?.team1CardPoints ?? 0);
    const themRound = mineFirst
        ? (round?.team1CardPoints ?? 0)
        : (round?.team2CardPoints ?? 0);
    const myDeclarations = mineFirst
        ? (round?.team2Declarations ?? [])
        : (round?.team1Declarations ?? []);
    const theirDeclarations = mineFirst
        ? (round?.team1Declarations ?? [])
        : (round?.team2Declarations ?? []);

    const activeFlights =
        status === "connected" && round
            ? flights.filter(
                  (flight) =>
                      flight.roundNumber === round.roundNumber &&
                      flight.trickNumber === round.currentTrickNumber &&
                      flight.connectionEpoch === connectionEpoch,
              )
            : [];

    const localPending = activeFlights.some(
        (flight) => flight.local && !flight.confirmed,
    );
    const pendingHandKey = activeFlights.find(
        (flight) => flight.local && !flight.reduced,
    );
    const flyingCardKeys = new Set(
        activeFlights
            .filter((flight) => !flight.reduced && !flight.returning)
            .map((flight) => flight.key),
    );

    const throwLocalCard = (
        card: Card,
        origin: CardOrigin,
        declareBela = false,
    ) => {
        if (!round || localPending) return;

        const reduced = Boolean(reduceMotion);
        setFlights((current) => {
            const relevant = current.filter(
                (flight) =>
                    flight.roundNumber === round.roundNumber &&
                    flight.trickNumber === round.currentTrickNumber &&
                    flight.connectionEpoch === connectionEpoch,
            );

            return [
                ...relevant,
                {
                    id: nextFlightId.current++,
                    key: flightKey(chair, card),
                    card,
                    playerIndex: chair,
                    roundNumber: round.roundNumber,
                    trickNumber: round.currentTrickNumber,
                    connectionEpoch,
                    source: origin,
                    rotation: flightRotation(chair, seating.order),
                    landingRotation: 0,
                    local: true,
                    confirmed: false,
                    landed: reduced,
                    returning: false,
                    reduced,
                },
            ];
        });
        throwCard(card, declareBela);
    };

    /** A card leaves the hand either straight away, or after the bela question. */
    const play = (card: Card, origin: CardOrigin) => {
        if (
            round?.myBelaDeclared === false &&
            canDeclareBela(card, trumpSuite, game.hand, game.myPlayedCards)
        ) {
            setBelaCard({ card, origin });
            return;
        }

        throwLocalCard(card, origin);
    };

    const answerBela = (declare: boolean) => {
        if (belaCard) {
            throwLocalCard(belaCard.card, belaCard.origin, declare);
        }
        setBelaCard(null);
    };

    if (phase === "finished" && result) {
        return (
            <main
                className={cn(
                    "flex flex-1 flex-col justify-center py-10",
                    appGutters,
                )}
            >
                <GameOverPanel
                    result={result}
                    myTeamIndex={seating.teamIndex}
                    wonLabel={copy.over.won}
                    lostLabel={copy.over.lost}
                    scoreLabel={copy.over.score}
                />
            </main>
        );
    }

    const seatFor = (seat: number, variant: "wide" | "square") => (
        <GameSeat
            playerIndex={seat}
            name={nameOf(seat)}
            avatarUrl={avatarOf(seat)}
            active={round?.currentTurnIndex === seat}
            won={pendingBreak?.winningPlayerIndex === seat}
            variant={variant}
            wonLabel={copy.trick.won}
        />
    );
    /* Only the two states worth naming: it is yours, or it is theirs. Anything
       said between tricks would be gone before it was read. */
    const playing =
        round?.roundStatus === RoundStatus.PLAYING && pendingBreak === null;
    const turnNotice = !playing
        ? null
        : isMyTurn
          ? copy.trick.yourTurn
          : copy.trick.waitingFor.replace(
                "{name}",
                nameOf(round.currentTurnIndex),
            );

    const showRoundAction =
        phase === "declaring" ||
        phase === "declarations" ||
        (phase === "choosing-trump" && isMyTurn);

    return (
        <main ref={screenRef} className={screenClass}>
            <div className={scoreDockClass}>
                <div className={scoreDockContentClass}>
                    <ScoreBoard
                        usLabel={copy.score.us}
                        themLabel={copy.score.them}
                        usTotal={usTotal}
                        themTotal={themTotal}
                        usRound={usRound}
                        themRound={themRound}
                        usDeclarations={declarationPoints(myDeclarations)}
                        themDeclarations={declarationPoints(theirDeclarations)}
                        target={game.maxPoints}
                        targetLabel={copy.score.target}
                        trumpSuite={trumpSuite}
                        trumpLabel={copy.trump.label}
                        trumpName={trumpSuite ? copy.suits[trumpSuite] : null}
                        trumpCallerLabel={
                            round?.trumpCallerIndex === null ||
                            round?.trumpCallerIndex === undefined
                                ? null
                                : // Which side called is what the scoreboard is
                                  // about — a name is longer than the slot and gets
                                  // truncated, and it is the team that owes the
                                  // contract anyway.
                                  round.trumpCallerIndex === chair ||
                                    round.trumpCallerIndex === across
                                  ? copy.trump.calledByUs
                                  : copy.trump.calledByThem
                        }
                        declarationsLabel={copy.score.declarations}
                        totalLabel={copy.score.total}
                        showDeclarationsLabel={copy.declarations.show}
                        onShowDeclarations={setShowDeclarations}
                    />

                    {/* The only way off this screen, and it has to be here: the play
                        route hides the navigation frame, so there is no chrome to
                        hang it from. Under the score rather than beside it — the bar
                        is as wide as the table, and squeezing a control in next to
                        it took room off the one thing on screen that is read every
                        trick.

                        Built like the bar it hangs from rather than like a lobby
                        button: same surface, same corner, same drop shadow, and a
                        hover that only warms the glyph. An ink border and a hard
                        shadow out here would be the loudest thing over the felt.

                        `pointer-events-auto` opts back in: the dock is inert so the
                        felt underneath stays reachable. */}
                    <button
                        type="button"
                        onClick={() => setConfirmingLeave(true)}
                        aria-label={copy.leave.action}
                        title={copy.leave.action}
                        className={cn(
                            "pointer-events-auto grid cursor-pointer place-items-center self-end",
                            panel,
                            "size-10 text-mint desk:size-11",
                            "transition-colors hover:text-cream",
                            focusRing,
                        )}
                    >
                        <LogOut aria-hidden size={17} strokeWidth={3} />
                    </button>
                </div>
            </div>
            <div className={scoreSpacerClass} aria-hidden="true" />

            <div className={playAreaClass}>
                <GameTableStage
                    across={seatFor(across, "wide")}
                    left={seatFor(left, "square")}
                    right={seatFor(right, "square")}
                    centre={
                        <Centre
                            copy={copy}
                            phase={phase}
                            round={round}
                            order={seating.order}
                            isMyTurn={isMyTurn}
                            nameOf={nameOf}
                            flyingCardKeys={flyingCardKeys}
                        />
                    }
                />
            </div>

            <div className={turnNoticeClass}>
                <p
                    aria-live="polite"
                    className="text-center text-[13px] font-semibold text-mint/70 flat:text-[11px]"
                >
                    {turnNotice}
                </p>
            </div>

            <div className={handAreaClass}>
                <HandFan
                    hand={game.hand}
                    trumpSuite={trumpSuite}
                    trickCards={round?.trickCards ?? []}
                    active={
                        isMyTurn &&
                        !localPending &&
                        round?.roundStatus === RoundStatus.PLAYING &&
                        pendingBreak === null
                    }
                    onPlay={play}
                    pendingCardKey={
                        pendingHandKey ? cardKey(pendingHandKey.card) : null
                    }
                    hiddenLabel={copy.hiddenCard}
                    hiddenCount={
                        phase === "choosing-trump"
                            ? Math.max(0, 8 - game.hand.length)
                            : 0
                    }
                />
            </div>

            <div className={timerAreaClass}>
                <TurnTimer
                    countdown={
                        phase === "choosing-trump"
                            ? trumpCountdown
                            : phase === "declaring"
                              ? declaringCountdown
                              : phase === "declarations"
                                ? declarationCountdown
                                : turnCountdown
                    }
                    label={
                        phase === "declaring"
                            ? copy.timer.declaring
                            : phase === "declarations"
                              ? copy.timer.declarations
                              : copy.timer.turn
                    }
                    urgent={
                        isMyTurn &&
                        phase !== "declaring" &&
                        phase !== "declarations"
                    }
                />

                {pendingBreak && (
                    <TurnTimer
                        countdown={pendingBreak}
                        label={
                            pendingBreak.kind === "trick"
                                ? copy.timer.nextTrick
                                : copy.timer.nextRound
                        }
                    />
                )}
            </div>

            <AnimatePresence mode="wait">
                {showRoundAction && round ? (
                    <RoundActionOverlay key={`${phase}-${round.roundNumber}`}>
                        <RoundAction
                            copy={copy}
                            phase={phase}
                            round={round}
                            isMyTurn={isMyTurn}
                            canPass={canPass}
                            chair={chair}
                            myDeclarations={myDeclarations}
                            theirDeclarations={theirDeclarations}
                            nameOf={nameOf}
                            onChooseTrump={chooseTrump}
                            onPassTrump={passTrump}
                            onDeclare={declareDeclarations}
                            onDecline={declineDeclarations}
                        />
                    </RoundActionOverlay>
                ) : null}
            </AnimatePresence>

            {showDeclarations && (
                <DeclarationsDialog
                    heading={copy.declarations.heading}
                    label={
                        showDeclarations === "us"
                            ? copy.declarations.mine
                            : copy.declarations.theirs
                    }
                    declarations={
                        showDeclarations === "us"
                            ? myDeclarations
                            : theirDeclarations
                    }
                    typeNames={copy.declarations.types}
                    totalLabel={copy.declarations.total}
                    closeLabel={copy.declarations.close}
                    nameOf={nameOf}
                    onClose={() => setShowDeclarations(null)}
                />
            )}

            {belaCard && (
                <BelaPrompt
                    card={belaCard.card}
                    heading={copy.bela.heading}
                    body={copy.bela.body}
                    declareLabel={copy.bela.declare}
                    skipLabel={copy.bela.skip}
                    onAnswer={answerBela}
                />
            )}

            {/* Under the scoreboard, not over it. The call is a two-and-a-half
                second interruption and the board it used to cover is the one
                thing on this screen that is read every trick — including the
                declaration bonus this very call has just changed. Same offsets
                the action overlay hangs from, so the two never disagree about
                where the felt starts. */}
            <div className="pointer-events-none fixed top-[max(6.5rem,calc(env(safe-area-inset-top)+5.75rem))] left-1/2 z-[60] w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 flat:top-[max(4.5rem,calc(env(safe-area-inset-top)+4rem))] desk:top-[max(7rem,calc(env(safe-area-inset-top)+6rem))]">
                <AnimatePresence mode="wait">
                    {belaAnnouncement ? (
                        <BelaAnnouncement
                            key={belaAnnouncement.key}
                            card={belaAnnouncement.card}
                            message={copy.bela.announcement.replace(
                                "{name}",
                                nameOf(belaAnnouncement.playerIndex),
                            )}
                            pointsLabel={copy.bela.points}
                        />
                    ) : null}
                </AnimatePresence>
            </div>

            {confirmingLeave && (
                <LeaveMatchDialog
                    copy={copy.leave}
                    onConfirm={leaveMatch}
                    onClose={() => setConfirmingLeave(false)}
                />
            )}

            <CardFlightLayer
                flights={activeFlights.filter((flight) => !flight.reduced)}
                rootRef={screenRef}
                onComplete={completeFlight}
            />

            <span className="sr-only">{gameId}</span>
        </main>
    );
}

/** What sits on the felt, which is different in every phase of a round. */
function Centre({
    copy,
    phase,
    round,
    order,
    isMyTurn,
    nameOf,
    flyingCardKeys,
}: {
    copy: Dictionary["game"];
    phase: GamePhase;
    round: RoundView | null;
    order: [number, number, number, number];
    isMyTurn: boolean;
    nameOf: (seat: number) => string;
    flyingCardKeys: ReadonlySet<string>;
}) {
    if (phase === "waiting") return <Notice>{copy.waiting}</Notice>;
    if (phase === "dealing" || !round) {
        return <DealCountdown label={copy.dealing} />;
    }

    if (phase === "choosing-trump") {
        if (!isMyTurn) {
            return (
                <Notice>
                    {copy.trump.waiting.replace(
                        "{name}",
                        nameOf(round.currentTurnIndex),
                    )}
                </Notice>
            );
        }

        return <Notice>{copy.trick.yourTurn}</Notice>;
    }

    if (phase === "declaring" || phase === "declarations") {
        return (
            <Notice>
                {phase === "declaring"
                    ? copy.declarations.promptHeading
                    : copy.declarations.heading}
            </Notice>
        );
    }

    return (
        <TrickPile
            playedCards={round.trickCards}
            order={order}
            // Whose move it is is said over the hand now, in every state
            // rather than only in the gap before the first card is down.
            emptyLabel={copy.trick.empty}
            roundNumber={round.roundNumber}
            trickNumber={round.currentTrickNumber}
            flyingCardKeys={flyingCardKeys}
        />
    );
}

type RoundActionProps = {
    copy: Dictionary["game"];
    phase: GamePhase;
    round: RoundView;
    isMyTurn: boolean;
    canPass: boolean;
    chair: number;
    myDeclarations: Declaration[];
    theirDeclarations: Declaration[];
    nameOf: (seat: number) => string;
    onChooseTrump: (suite: Suite) => void;
    onPassTrump: () => void;
    onDeclare: () => void;
    onDecline: () => void;
};

/** The contents of the fixed decision overlay. */
function RoundAction({
    copy,
    phase,
    round,
    isMyTurn,
    canPass,
    chair,
    myDeclarations,
    theirDeclarations,
    nameOf,
    onChooseTrump,
    onPassTrump,
    onDeclare,
    onDecline,
}: RoundActionProps) {
    if (phase === "choosing-trump" && isMyTurn) {
        return (
            <TrumpChooser
                suiteNames={copy.suits}
                heading={copy.trump.heading}
                passLabel={copy.trump.pass}
                mustCallNote={copy.trump.mustCall}
                canPass={canPass}
                onChoose={onChooseTrump}
                onPass={onPassTrump}
            />
        );
    }

    if (phase !== "declaring" && phase !== "declarations") return null;

    const panel = (
        <DeclarationsPanel
            key={round.roundNumber}
            mine={myDeclarations}
            theirs={theirDeclarations}
            typeNames={copy.declarations.types}
            nameOf={nameOf}
            heading={copy.declarations.heading}
            promptHeading={copy.declarations.promptHeading}
            promptBody={copy.declarations.promptBody}
            promptBodyNone={copy.declarations.promptBodyNone}
            mineLabel={copy.declarations.mine}
            theirsLabel={copy.declarations.theirs}
            noneLabel={copy.declarations.none}
            declareLabel={copy.declarations.declare}
            declineLabel={copy.declarations.decline}
            updatingLabel={copy.declarations.updating}
            totalLabel={copy.declarations.total}
            my={round.myDeclarations}
            asking={phase === "declaring"}
            answered={round.answeredDeclarationSeats.includes(chair)}
            onDeclare={onDeclare}
            onDecline={onDecline}
        />
    );

    return panel;
}

/**
 * The rise used for trump and declaration decisions.
 *
 * The same block and the same curve as a dialog, deliberately without the dim:
 * these are decisions taken while reading the table, and darkening the felt and
 * the hand would hide the very thing being decided. What makes them read as one
 * family with the dialogs is `panelRaised` and the shared `pop*` motion, not a
 * scrim.
 */
function RoundActionOverlay({ children }: { children: React.ReactNode }) {
    const reduceMotion = useReducedMotion();

    return (
        <div className={actionOverlayClass}>
            <motion.div
                initial={reduceMotion ? false : popEnterFrom}
                animate={popEnterTo}
                exit={reduceMotion ? { opacity: 0 } : popExitTo}
                transition={reduceMotion ? { duration: 0 } : popTransition}
                className={cn(
                    panelRaised,
                    // `w-fit` hugs the content, but `min-w` can still make the
                    // block wider than it — and a shrink-to-fit child inside a
                    // block box would then sit against the left padding rather
                    // than in the middle. Centring is the column's job, not the
                    // content's.
                    "pointer-events-auto flex max-h-full w-fit max-w-full flex-col items-center justify-self-center overflow-y-auto overscroll-contain px-4 py-3.5 desk:min-w-[20rem] desk:px-5 desk:py-4",
                )}
            >
                {children}
            </motion.div>
        </div>
    );
}

function Notice({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <p
            className={cn(
                "py-6 text-center text-[14px] font-semibold text-mint/70",
                // On a felt this small the padding is most of the box.
                "felt-short:py-2 felt-short:text-[12px] felt-short:leading-tight",
                className,
            )}
        >
            {children}
        </p>
    );
}
