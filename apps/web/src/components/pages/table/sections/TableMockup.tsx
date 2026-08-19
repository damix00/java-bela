import CardFan from "@/components/pages/table/blocks/CardFan";
import EmptySeat from "@/components/pages/table/blocks/EmptySeat";
import MockLabel from "@/components/pages/table/blocks/MockLabel";
import PlayModes from "@/components/pages/table/blocks/PlayModes";
import SeatCard from "@/components/pages/table/blocks/SeatCard";
import { mockTable } from "@/components/pages/table/mock-data";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { authPath } from "@/lib/routes";
import { appGutters } from "@/lib/styles";
import { cn } from "@/lib/cn";

type TableMockupProps = {
    copy: Dictionary["table"];
    errors: Dictionary["form"]["errors"];
    locale: Locale;
};

/**
 * A matchmaking lobby preview, built around one question: what do I press?
 *
 * Two things are on the screen and nothing else is — the seats, and the bar
 * that fills them. Standings, friends and match history each want a page, not
 * a column beside a table; the only progression here is the meter in the top
 * bar, which is the glance rather than the browse. What that costs in
 * furniture it buys back in certainty about where to click.
 *
 * So the screen is sized to be exactly one screen. The stage is centred in
 * whatever height is left under the header instead of stacking from the top,
 * because leftover space split above and below reads as a table with room
 * around it, while the same space pooled at the bottom reads as a page that
 * ran out of content. The felt underneath does the rest of that work.
 *
 * The seats are laid out as the table itself: partner across, the two open
 * seats to either side, you at the near edge. The same arrangement holds at
 * every width — the side seats narrow to their squares on a phone rather than
 * dropping out, so the shape of what is being joined survives down to 360px.
 * The wide arrangement waits for `lg` now: with the marketing page's gutters
 * these routes have ~544px to work with at `md`, and three columns in that is
 * narrower per seat than the phone layout it would be replacing.
 */
export default function TableMockup({
    copy,
    errors,
    locale,
}: TableMockupProps) {
    const signIn = authPath(locale, "signIn");

    return (
        <div className="flex flex-1 flex-col">
            <main
                className={cn(
                    "flex flex-1 flex-col justify-center py-8 md:py-10",
                    appGutters,
                )}
            >
                <div className="flex min-w-0 flex-col gap-8 sm:gap-10">
                    <div className="mx-auto grid w-full max-w-[560px] grid-cols-[60px_minmax(0,1fr)_60px] items-stretch gap-3 sm:grid-cols-[104px_minmax(0,1fr)_104px] sm:gap-4 lg:max-w-[1000px] lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)_minmax(0,1fr)] lg:gap-6 xl:gap-8">
                        <SeatCard
                            className="col-span-3 col-start-1 row-start-1 w-full lg:col-span-1 lg:col-start-2"
                            name={mockTable.partner.name}
                            meta={`${copy.partner} · ${mockTable.partner.rating}`}
                            suit={mockTable.partner.suit}
                            tone={mockTable.partner.tone}
                        />

                        <EmptySeat
                            label={copy.inviteSeat}
                            className="col-start-1 row-start-2 aspect-square w-full self-center lg:mx-auto lg:max-w-[240px]"
                        />

                        <div className="col-start-2 row-start-2 w-full border-4 border-ink bg-baize-deep p-2 shadow-hard-lg lg:p-[10px]">
                            <div className="flex h-full flex-col items-center justify-center gap-4 border-2 border-mint/15 bg-baize px-3 py-6 sm:px-5 sm:py-8">
                                <CardFan />
                                <MockLabel className="text-center text-[10px] tracking-[.1em] text-mint/75 sm:text-[11px] sm:tracking-[.14em]">
                                    {copy.queueValue}
                                </MockLabel>
                            </div>
                        </div>

                        <EmptySeat
                            label={copy.inviteSeat}
                            className="col-start-3 row-start-2 aspect-square w-full self-center lg:mx-auto lg:max-w-[240px]"
                        />

                        <SeatCard
                            className="col-span-3 col-start-1 row-start-3 w-full lg:col-span-1 lg:col-start-2"
                            name={mockTable.you.name}
                            meta={`${mockTable.you.rating} · ${copy.dealer}`}
                            suit={mockTable.you.suit}
                            tone={mockTable.you.tone}
                            tag={copy.you}
                        />
                    </div>

                    <PlayModes
                        copy={copy}
                        errors={errors}
                        locale={locale}
                        signInHref={signIn}
                    />
                </div>
            </main>
        </div>
    );
}
