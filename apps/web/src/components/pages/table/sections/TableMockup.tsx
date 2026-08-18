import CardFan from "@/components/pages/table/blocks/CardFan";
import EmptySeat from "@/components/pages/table/blocks/EmptySeat";
import LobbyRail from "@/components/pages/table/blocks/LobbyRail";
import MockHeader from "@/components/pages/table/blocks/MockHeader";
import MockLabel from "@/components/pages/table/blocks/MockLabel";
import PlayModes from "@/components/pages/table/blocks/PlayModes";
import SeatCard from "@/components/pages/table/blocks/SeatCard";
import { mockTable } from "@/components/pages/table/mock-data";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { authPath } from "@/lib/routes";

type TableMockupProps = {
    copy: Dictionary["table"];
    errors: Dictionary["form"]["errors"];
    locale: Locale;
};

/**
 * A matchmaking lobby preview, built around one question: what do I press?
 *
 * There is exactly one headline action — play ranked — and it is the widest
 * block on the screen, directly under the table it starts. The line beneath it
 * answers the objection a first-time player actually has: the opponents will be
 * of roughly your strength, which is the thing a casual belote room cannot
 * promise. The unranked doors sit below that, smaller, because they are the
 * lesser promise — and two of them need no account at all.
 *
 * The seats are laid out as the table itself: partner across, the two open
 * seats to either side, you at the near edge. The same arrangement holds at
 * every width — the side seats narrow to their squares on a phone rather than
 * dropping out, so the shape of what is being joined survives down to 360px.
 */
export default function TableMockup({
    copy,
    errors,
    locale,
}: TableMockupProps) {
    const signIn = authPath(locale, "signIn");

    return (
        <div className="flex min-h-screen flex-1 flex-col bg-baize">
            <MockHeader copy={copy} />

            <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 md:px-8 xl:px-10">
                <div className="mx-auto grid w-full max-w-[1220px] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_338px] xl:gap-12">
                    <section className="flex min-w-0 flex-col gap-6 sm:gap-7">
                        <div className="mx-auto grid w-full max-w-[560px] grid-cols-[60px_minmax(0,1fr)_60px] items-stretch gap-3 sm:grid-cols-[104px_minmax(0,1fr)_104px] sm:gap-4 md:max-w-none md:grid-cols-[minmax(0,1fr)_minmax(250px,340px)_minmax(0,1fr)] md:gap-6 lg:gap-8">
                            <SeatCard
                                className="col-span-3 col-start-1 row-start-1 w-full md:col-span-1 md:col-start-2"
                                name={mockTable.partner.name}
                                meta={`${copy.partner} · ${mockTable.partner.rating}`}
                                suit={mockTable.partner.suit}
                                tone={mockTable.partner.tone}
                            />

                            <EmptySeat
                                label={copy.inviteSeat}
                                className="col-start-1 row-start-2 aspect-square w-full self-center md:mx-auto md:max-w-[210px]"
                            />

                            <div className="col-start-2 row-start-2 w-full border-4 border-ink bg-baize-deep p-2 shadow-hard-lg md:p-[10px]">
                                <div className="flex h-full flex-col items-center justify-center gap-4 border-2 border-mint/15 bg-baize px-3 py-6 sm:px-5 sm:py-8">
                                    <CardFan />
                                    <MockLabel className="text-center text-[10px] tracking-[.1em] text-mint/60 sm:text-[11px] sm:tracking-[.14em]">
                                        {copy.queueValue}
                                    </MockLabel>
                                </div>
                            </div>

                            <EmptySeat
                                label={copy.inviteSeat}
                                className="col-start-3 row-start-2 aspect-square w-full self-center md:mx-auto md:max-w-[210px]"
                            />

                            <SeatCard
                                className="col-span-3 col-start-1 row-start-3 w-full md:col-span-1 md:col-start-2"
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
                    </section>

                    <LobbyRail copy={copy} />
                </div>
            </main>
        </div>
    );
}
