import type { GameResult } from "@/context/game-context";

type GameOverPanelProps = {
    result: GameResult;
    /** Which of the two teams is mine, so the verdict can be "you". -1 if neither. */
    myTeamIndex: number;
    wonLabel: string;
    lostLabel: string;
    scoreLabel: string;
};

/**
 * How it ended.
 *
 * Read-only on purpose: `GameScreen` sends `game:leave` and navigates on its own
 * a few seconds after the result lands, so there is nothing here to press and
 * nothing counting down to watch.
 *
 * `winningTeamIndex` is the backend's 0-or-1 over `team1`/`team2`, which is the
 * same axis `seatingFor` reports a player's own team on — so the verdict is a
 * comparison, not a lookup.
 */
export default function GameOverPanel({
    result,
    myTeamIndex,
    wonLabel,
    lostLabel,
    scoreLabel,
}: GameOverPanelProps) {
    const won = myTeamIndex !== -1 && result.winningTeamIndex === myTeamIndex;

    // Read from my side of the table when I have one, and left-to-right when I
    // am only watching.
    const [mine, theirs] =
        myTeamIndex === 1
            ? [result.team2FinalScore, result.team1FinalScore]
            : [result.team1FinalScore, result.team2FinalScore];

    return (
        <div className="mx-auto flex w-full max-w-[420px] flex-col items-center gap-4 rounded-2xl bg-baize-deep p-6 shadow-[0_12px_36px_-10px_rgb(0_0_0_/_0.6)]">
            <p className="font-display text-[26px] font-extrabold tracking-[-.02em] text-cream">
                {won ? wonLabel : lostLabel}
            </p>

            <p className="text-[15px] font-semibold text-mint/80">
                {scoreLabel
                    .replace("{us}", String(mine))
                    .replace("{them}", String(theirs))}
            </p>
        </div>
    );
}
