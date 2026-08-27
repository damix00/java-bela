import type { ReactNode } from "react";

import UserAvatar from "@/components/layout/UserAvatar";
import Flag from "@/components/ui/graphics/Flag";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";
import { countryName } from "@/lib/i18n/countries";
import type { Locale } from "@/lib/i18n/config";

type ProfileHeroProps = {
    username: string;
    avatarUrl: string | null;
    bio: string | null;
    countryCode: string | null;
    /** ISO-8601, straight off the user record. */
    createdAt: string;
    copy: Dictionary["profile"];
    locale: Locale;
    /** The one control the banner carries — the cross-link to settings. */
    action?: ReactNode;
};

/**
 * Who the account is, at the size a profile is actually about.
 *
 * The page used to open with its own heading on the felt and a small identity
 * strip under it, which said the player's name twice and gave neither saying
 * any weight. This is the banner instead: it is the page's `h1`, and everything
 * below it — the account facts, the form — is a block laid on the same felt.
 *
 * Three tiers, in the order someone reads them: who (name, flag, picture), what
 * they say about themselves (the bio), and what the app can vouch for (the meta
 * rail). The rail holds the join date and the country and nothing else, because
 * those are the only two facts behind this screen. No rating, no games played,
 * no streak — the top bar had to stop inventing those and this is not the place
 * to start again.
 *
 * The rust band across the top is the cover photo's job done in one colour: it
 * puts the block a step above the cream panels below without making it taller.
 *
 * Takes the fields rather than a `User`, so nothing here assumes the player
 * being drawn is the one signed in.
 */
export default function ProfileHero({
    username,
    avatarUrl,
    bio,
    countryCode,
    createdAt,
    copy,
    locale,
    action,
}: ProfileHeroProps) {
    const joined = new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
    }).format(new Date(createdAt));

    const country = countryCode ? countryName(locale, countryCode) : null;

    return (
        <section className="border-4 border-ink bg-cream shadow-hard-lg">
            <div className="h-3 border-b-4 border-ink bg-rust" />

            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-7">
                <UserAvatar
                    username={username}
                    avatarUrl={avatarUrl}
                    size="lg"
                    className="size-20 shrink-0 border-4 border-ink text-[32px] sm:size-24 sm:text-[38px]"
                />

                <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <Heading
                                as="h1"
                                size="cardHero"
                                className="min-w-0 truncate"
                            >
                                {username}
                            </Heading>
            {/* Decoration beside a name the rail spells out in
                                words — a screen reader saying "flag: Croatia"
                                here would be the country said twice. */}
                            <Flag code={countryCode} size="md" />
                        </div>
                        {action}
                    </div>

                    {/* The line under the name, which is the player's to write.
                        Empty, it is a prompt rather than a gap: the box that
                        fills it is a few centimetres further down the page. */}
                    <Text size="sm" tone={bio ? "ink" : "muted"}>
                        {bio || copy.bioEmpty}
                    </Text>
                </div>
            </div>

            {/* Sentence case, not the small caps this app labels things in.
                An `Eyebrow` is an annotation — a field name, a step counter —
                and setting a month and a country in tracked-out capitals turns
                two ordinary facts about a person into machine output. */}
            <Text
                size="xs"
                className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t-4 border-ink px-5 py-3 sm:px-7"
            >
                <span>
                    {copy.memberSince} {joined}
                </span>
                {country && (
                    <>
                        <span aria-hidden="true">·</span>
                        <span>{country}</span>
                    </>
                )}
            </Text>
        </section>
    );
}
