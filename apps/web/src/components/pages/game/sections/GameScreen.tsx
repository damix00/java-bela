"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    RoundStatus,
    type Card,
    type Declaration,
    type Suite,
} from "@bela/protocol";

import type { User } from "@/api/types/user";
import BelaPrompt from "@/components/pages/game/blocks/controls/BelaPrompt";
import DeclarationsPanel from "@/components/pages/game/blocks/controls/DeclarationsPanel";
import TrumpChooser from "@/components/pages/game/blocks/controls/TrumpChooser";
import HandFan from "@/components/pages/game/blocks/cards/HandFan";
import GameSeat from "@/components/pages/game/blocks/table/GameSeat";
import GameTableStage from "@/components/pages/game/blocks/table/GameTableStage";
import TrickPile from "@/components/pages/game/blocks/table/TrickPile";
import GameOverPanel from "@/components/pages/game/blocks/status/GameOverPanel";
import DealCountdown from "@/components/pages/game/blocks/status/DealCountdown";
import ScoreBoard from "@/components/pages/game/blocks/status/ScoreBoard";
import TurnTimer from "@/components/pages/game/blocks/status/TurnTimer";
import {
    useGame,
    useGameActions,
    type GamePhase,
    type RoundView,
} from "@/context/game-context";
import {
    SNAPSHOT_GRACE_MS,
    useLobbyActions,
} from "@/context/lobby-context";
import { useSocketStatus } from "@/context/socket-context";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/cn";
import { canDeclareBela } from "@/lib/game-rules";
import type { Locale } from "@/lib/i18n";
import { homePath } from "@/lib/routes";
import { appGutters } from "@/lib/styles";

/* The screen's own frame. On a phone it is the viewport, safe areas included,
   and nothing is allowed to scroll out of it; once both dimensions can hold the
   desktop table it becomes an ordinary centred page on the app's gutters. */
const screenClass = [
    "flex h-full min-h-0 flex-auto flex-col gap-2 overflow-hidden",
    "pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]",
    "pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]",
    // A shorter phone gives the fixed furniture less and the table more.
    "portrait-sm:gap-1.5",
    "flat:gap-1 flat:pt-[max(0.375rem,env(safe-area-inset-top))] flat:pb-[max(0.375rem,env(safe-area-inset-bottom))]",
    "desk:h-auto desk:min-h-full desk:justify-center desk:gap-4 desk:overflow-visible desk:px-8 desk:py-6",
    "desk-md:px-28 desk-lg:px-48 desk-xl:px-72",
].join(" ");

/* The score sits over the screen rather than in its flow, so the table keeps
   the height. `scoreSpacerClass` is what reserves the row it covers. */
const scoreDockClass = [
    "pointer-events-none fixed z-30 flex justify-center",
    "top-[max(0.75rem,env(safe-area-inset-top))]",
    "left-[max(0.75rem,env(safe-area-inset-left))] right-[max(0.75rem,env(safe-area-inset-right))]",
    "flat:top-[max(0.375rem,env(safe-area-inset-top))]",
    "desk:top-6 desk:left-8 desk:right-8",
    "desk-md:left-28 desk-md:right-28",
    "desk-lg:left-48 desk-lg:right-48",
    "desk-xl:left-72 desk-xl:right-72",
].join(" ");

/* Laid flat, the table is the only thing with no room to spare, so every row
   that is not the table gives up what it can — this one included. */
const scoreSpacerClass = [
    "w-full h-16 flex-[0_0_4rem]",
    "portrait-sm:h-14 portrait-sm:flex-[0_0_3.5rem]",
    "flat:h-12 flat:flex-[0_0_3rem]",
    "desk:h-19 desk:flex-[0_0_4.75rem]",
].join(" ");

const playAreaClass = [
    "flex w-full min-h-0 flex-auto items-stretch mt-2",
    "portrait-sm:mt-1",
    "flat:mt-0",
    "desk:min-h-[auto] desk:flex-none desk:items-center desk:mt-4",
].join(" ");

/* On the desktop table the timer sits above the hand; on a phone it sits under
   it, where the thumb is not covering it. */
const timerAreaClass = "flex flex-none flex-col gap-1 desk:order-1";
const handAreaClass = "flex flex-none justify-center desk:order-2";

/* The decision surface, and the near seat's own label, are phone furniture:
   above `desk` the felt and the table's fourth chair carry both. */
const mobileActionClass = "flex w-full flex-none justify-center desk:hidden";
const mobilePlayerClass =
    "flex w-full min-h-9 flex-none justify-center desk:hidden";
const mobileOnlyClass = "block desk:hidden";
const desktopOnlyClass = "hidden desk:block";

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
        turnCountdown,
        pendingBreak,
        canPass,
        result,
    } = useGame();
    const { ready, chooseTrump, passTrump, throwCard, declineDeclarations } =
        useGameActions();
    const { leave } = useLobbyActions();
    const status = useSocketStatus();
    const router = useRouter();

    /** The card waiting on a bela answer. Cleared as soon as it is thrown. */
    const [belaCard, setBelaCard] = useState<Card | null>(null);

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
    const [near, left, across, right] = seating.order;

    const mineFirst = seating.teamIndex === 1;
    const usTotal = mineFirst ? game.team2.totalScore : game.team1.totalScore;
    const themTotal = mineFirst ? game.team1.totalScore : game.team2.totalScore;
    const usRound = mineFirst
        ? (round?.team2RoundPoints ?? 0)
        : (round?.team1RoundPoints ?? 0);
    const themRound = mineFirst
        ? (round?.team1RoundPoints ?? 0)
        : (round?.team2RoundPoints ?? 0);
    const myDeclarations = mineFirst
        ? (round?.team2Declarations ?? [])
        : (round?.team1Declarations ?? []);
    const theirDeclarations = mineFirst
        ? (round?.team1Declarations ?? [])
        : (round?.team2Declarations ?? []);

    /** A card leaves the hand either straight away, or after the bela question. */
    const play = (card: Card) => {
        if (canDeclareBela(card, trumpSuite, game.hand, game.myPlayedCards)) {
            setBelaCard(card);
            return;
        }

        throwCard(card);
    };

    const answerBela = (declare: boolean) => {
        if (belaCard) throwCard(belaCard, declare);
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
                    backLabel={copy.over.back}
                    onBack={() => {
                        leave();
                        router.push(homePath(locale));
                    }}
                />
            </main>
        );
    }

    const seatFor = (
        seat: number,
        variant: "wide" | "square" | "inline",
    ) => (
        <GameSeat
            name={nameOf(seat)}
            avatarUrl={avatarOf(seat)}
            active={round?.currentTurnIndex === seat}
            won={pendingBreak?.winningPlayerIndex === seat}
            variant={variant}
            youLabel={seat === chair ? copy.you : undefined}
            wonLabel={copy.trick.won}
        />
    );
    const showMobileAction =
        phase === "declarations" ||
        (phase === "choosing-trump" && isMyTurn);

    return (
        <main className={screenClass}>
            <div className={scoreDockClass}>
                <ScoreBoard
                    usLabel={copy.score.us}
                    themLabel={copy.score.them}
                    usTotal={usTotal}
                    themTotal={themTotal}
                    usRound={usRound}
                    themRound={themRound}
                    target={game.maxPoints}
                    targetLabel={copy.score.target}
                    trumpSuite={trumpSuite}
                    trumpLabel={copy.trump.label}
                    trumpName={trumpSuite ? copy.suits[trumpSuite] : null}
                    trumpCallerLabel={
                        round?.trumpCallerIndex === null ||
                        round?.trumpCallerIndex === undefined
                            ? null
                            : copy.trump.calledBy.replace(
                                  "{name}",
                                  nameOf(round.trumpCallerIndex),
                              )
                    }
                    roundLabel={copy.score.round}
                />
            </div>
            <div className={scoreSpacerClass} aria-hidden="true" />

            <div className={playAreaClass}>
                <GameTableStage
                    compact={showMobileAction}
                    near={seatFor(near, "wide")}
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
                            canPass={canPass}
                            chair={chair}
                            nameOf={nameOf}
                            myDeclarations={myDeclarations}
                            theirDeclarations={theirDeclarations}
                            onChooseTrump={chooseTrump}
                            onPassTrump={passTrump}
                            onDecline={declineDeclarations}
                        />
                    }
                />
            </div>

            {showMobileAction && round ? (
                <div className={mobileActionClass}>
                    <RoundAction
                        copy={copy}
                        phase={phase}
                        round={round}
                        isMyTurn={isMyTurn}
                        canPass={canPass}
                        chair={chair}
                        myDeclarations={myDeclarations}
                        theirDeclarations={theirDeclarations}
                        onChooseTrump={chooseTrump}
                        onPassTrump={passTrump}
                        onDecline={declineDeclarations}
                        variant="tray"
                    />
                </div>
            ) : null}

            <div className={handAreaClass}>
                <HandFan
                    hand={game.hand}
                    trumpSuite={trumpSuite}
                    trickCards={round?.trickCards ?? []}
                    active={
                        isMyTurn &&
                        round?.roundStatus === RoundStatus.PLAYING &&
                        pendingBreak === null
                    }
                    onPlay={play}
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
                        phase === "choosing-trump" ? trumpCountdown : turnCountdown
                    }
                    label={copy.timer.turn}
                    urgent={isMyTurn}
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

            <div className={mobilePlayerClass}>
                {seatFor(near, "inline")}
            </div>

            {belaCard && (
                <BelaPrompt
                    card={belaCard}
                    heading={copy.bela.heading}
                    body={copy.bela.body}
                    declareLabel={copy.bela.declare}
                    skipLabel={copy.bela.skip}
                    onAnswer={answerBela}
                />
            )}

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
    canPass,
    chair,
    nameOf,
    myDeclarations,
    theirDeclarations,
    onChooseTrump,
    onPassTrump,
    onDecline,
}: {
    copy: Dictionary["game"];
    phase: GamePhase;
    round: RoundView | null;
    order: [number, number, number, number];
    isMyTurn: boolean;
    canPass: boolean;
    chair: number;
    nameOf: (seat: number) => string;
    myDeclarations: Declaration[];
    theirDeclarations: Declaration[];
    onChooseTrump: (suite: Suite) => void;
    onPassTrump: () => void;
    onDecline: () => void;
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

        return (
            <>
                <Notice className={cn(mobileOnlyClass, "py-2")}>
                    {copy.trick.yourTurn}
                </Notice>
                <div className={desktopOnlyClass}>
                    <RoundAction
                        copy={copy}
                        phase={phase}
                        round={round}
                        isMyTurn={isMyTurn}
                        canPass={canPass}
                        chair={chair}
                        myDeclarations={myDeclarations}
                        theirDeclarations={theirDeclarations}
                        onChooseTrump={onChooseTrump}
                        onPassTrump={onPassTrump}
                        onDecline={onDecline}
                        variant="table"
                    />
                </div>
            </>
        );
    }

    if (phase === "declarations") {
        return (
            <>
                <Notice className={cn(mobileOnlyClass, "py-2")}>
                    {copy.declarations.heading}
                </Notice>
                <div className={desktopOnlyClass}>
                    <RoundAction
                        copy={copy}
                        phase={phase}
                        round={round}
                        isMyTurn={isMyTurn}
                        canPass={canPass}
                        chair={chair}
                        myDeclarations={myDeclarations}
                        theirDeclarations={theirDeclarations}
                        onChooseTrump={onChooseTrump}
                        onPassTrump={onPassTrump}
                        onDecline={onDecline}
                        variant="table"
                    />
                </div>
            </>
        );
    }

    return (
        <TrickPile
            playedCards={round.trickCards}
            order={order}
            winningPlayerIndex={round.trickWinningPlayerIndex}
            emptyLabel={
                isMyTurn ? copy.trick.yourTurn : copy.trick.empty
            }
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
    onChooseTrump: (suite: Suite) => void;
    onPassTrump: () => void;
    onDecline: () => void;
    variant: "table" | "tray";
};

/** The decision surface moves beside the hand on phones and onto the felt above. */
function RoundAction({
    copy,
    phase,
    round,
    isMyTurn,
    canPass,
    chair,
    myDeclarations,
    theirDeclarations,
    onChooseTrump,
    onPassTrump,
    onDecline,
    variant,
}: RoundActionProps) {
    if (phase === "choosing-trump" && isMyTurn) {
        return (
            <TrumpChooser
                suiteNames={copy.suits}
                heading={copy.trump.heading}
                passLabel={copy.trump.pass}
                mustCallNote={copy.trump.mustCall}
                canPass={canPass}
                variant={variant}
                onChoose={onChooseTrump}
                onPass={onPassTrump}
            />
        );
    }

    if (phase !== "declarations") return null;

    const panel = (
        <DeclarationsPanel
            key={`${round.roundNumber}-${variant}`}
            mine={myDeclarations}
            theirs={theirDeclarations}
            heading={copy.declarations.heading}
            promptHeading={copy.declarations.promptHeading}
            promptBody={copy.declarations.promptBody}
            mineLabel={copy.declarations.mine}
            theirsLabel={copy.declarations.theirs}
            noneLabel={copy.declarations.none}
            declareLabel={copy.declarations.declare}
            declineLabel={copy.declarations.decline}
            updatingLabel={copy.declarations.updating}
            totalLabel={copy.declarations.total}
            canDecide={myDeclarations.some(
                (declaration) => declaration.playerIndex === chair,
            )}
            declined={round.declinedDeclarationSeats.includes(chair)}
            chair={chair}
            onDecline={onDecline}
        />
    );

    if (variant === "table") return panel;

    return (
        <div className="w-full border-4 border-ink bg-baize-deep px-3 py-2 shadow-hard-sm [@media(max-height:560px)]:py-1.5">
            {panel}
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
                className,
            )}
        >
            {children}
        </p>
    );
}
