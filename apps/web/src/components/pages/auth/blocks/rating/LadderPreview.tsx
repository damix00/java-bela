import DividedPanel from "@/components/ui/surfaces/DividedPanel";
import { cn } from "@/lib/ui/cn";

type LadderRow = {
    rank: string;
    name: string;
    rating: string;
    /** Only the player's own row carries an avatar. */
    glyph?: string;
};

type LadderPreviewProps = {
    rows: [LadderRow, LadderRow];
    className?: string;
};

/**
 * Two rows of the leaderboard with the new name already in place — what the
 * username being typed will look like where it ends up.
 */
export default function LadderPreview({ rows, className }: LadderPreviewProps) {
    const [own, next] = rows;

    return (
        <DividedPanel
            className={cn("w-full bg-cream shadow-hard-lg", className)}
        >
            <div className="flex items-center gap-3.5 bg-paper px-[18px] py-4">
                <span className="w-[34px] font-display text-[18px] font-extrabold text-ink">
                    {own.rank}
                </span>
                <span
                    aria-hidden
                    className="grid size-[38px] shrink-0 place-items-center border-[3px] border-ink bg-rust text-[19px] text-cream"
                >
                    {own.glyph}
                </span>
                <span className="mr-auto text-[17px] font-bold text-ink">
                    {own.name}
                </span>
                <span className="text-[15px] font-semibold text-ink">
                    {own.rating}
                </span>
            </div>
            <div className="flex items-center gap-3.5 px-[18px] py-3.5 text-stone">
                <span className="w-[34px] font-display text-[16px] font-extrabold">
                    {next.rank}
                </span>
                <span
                    aria-hidden
                    className="size-[34px] shrink-0 border-[3px] border-ash bg-sage"
                />
                <span className="mr-auto text-[16px] font-semibold">
                    {next.name}
                </span>
                <span className="text-[14px]">{next.rating}</span>
            </div>
        </DividedPanel>
    );
}
