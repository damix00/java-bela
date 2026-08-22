import { Button } from "@/components/controls/Button";
import type { GameResult } from "@/context/game-context";

type GameOverPanelProps = {
    result: GameResult;
    /** Which of the two teams is mine, so the verdict can be "you". -1 if neither. */
    myTeamIndex: number;
    wonLabel: string;
    lostLabel: string;
    scoreLabel: string;
    backLabel: string;
    /**
     * Leaves the table as well as navigating.
     *
     * Both halves are required. The backend marks the *game* finished and stops
     * there — `GameFlowService.endGameIfWon` never touches the lobby, which is
     * left saying IN_GAME with the finished game's id. Since a reconnect's
     * `lobby:initialState` routes an IN_GAME lobby back to its table, walking
     * away without leaving would keep pulling the player into a game that is
     * over.
     */
    onBack: () => void;
};

/**
 * How it ended, and the way out.
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
    backLabel,
    onBack,
}: GameOverPanelProps) {
    const won = myTeamIndex !== -1 && result.winningTeamIndex === myTeamIndex;

    // Read from my side of the table when I have one, and left-to-right when I
    // am only watching.
    const [mine, theirs] =
        myTeamIndex === 1
            ? [result.team2FinalScore, result.team1FinalScore]
            : [result.team1FinalScore, result.team2FinalScore];

    return (
        <div className="mx-auto flex w-full max-w-[420px] flex-col items-center gap-4 border-4 border-ink bg-baize-deep p-6 shadow-hard-lg">
            <p className="font-display text-[26px] font-extrabold tracking-[-.02em] text-cream">
                {won ? wonLabel : lostLabel}
            </p>

            <p className="text-[15px] font-semibold text-mint/80">
                {scoreLabel
                    .replace("{us}", String(mine))
                    .replace("{them}", String(theirs))}
            </p>

            <Button tone="rust" size="md" onClick={onBack}>
                {backLabel}
            </Button>
        </div>
    );
}
