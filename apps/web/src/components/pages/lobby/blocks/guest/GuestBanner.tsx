import { ButtonLink } from "@/components/controls/Button";
import GuestCountdown from "@/components/pages/lobby/blocks/guest/GuestCountdown";
import Card from "@/components/ui/surfaces/Card";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import TextLink from "@/components/ui/typography/TextLink";
import type { User } from "@/api/types/user";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { guestCountdown } from "@/lib/guest-session";
import { authPath } from "@/lib/routes";

type GuestBannerProps = {
    copy: Dictionary["lobby"]["guestBanner"];
    user: User;
    locale: Locale;
};

/**
 * Shown to guests, and only to guests. The backend sweeps anonymous accounts
 * 24 hours after they are made and their refresh token is cut to match, so a
 * guest who enjoys themselves and comes back tomorrow finds nothing — this is
 * the one prompt standing between that and a kept player.
 *
 * It leads with the clock rather than with the perks because the clock is the
 * part that is true right now: an account is not a feature list here, it is the
 * difference between this afternoon's games existing tomorrow and not. Rust,
 * and above the two table cards, for the same reason.
 *
 * Everything it claims is checkable — the deadline comes from the account's own
 * `createdAt`, and the three losses are three things the guest genuinely does
 * not have. Nothing here invents scarcity that the API does not enforce.
 */
export default function GuestBanner({ copy, user, locale }: GuestBannerProps) {
    // Rendered on the server so the sentence arrives complete, then handed to
    // the client component as the starting value to tick on from.
    const { expiresAt, label } = guestCountdown(user, copy.units);
    const timeLeft = label ?? copy.expired;
    const [before, after] = copy.deadline.split("{time}");

    return (
        <Card tone="rust" padding="md" className="gap-4">
            <Heading as="h2" size="card" tone="cream" className="max-w-[24ch]">
                {copy.heading}
            </Heading>

            {/* The one sentence with a number in it, sized above the list under it:
                a countdown is only pressure if it is the thing you read first. */}
            <Text size="lg" tone="cream" weight="medium" className="max-w-[46ch]">
                {before}
                <GuestCountdown
                    expiresAt={expiresAt}
                    initial={timeLeft}
                    units={copy.units}
                    expiredLabel={copy.expired}
                />
                {after}
            </Text>

            <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {copy.losses.map((loss) => (
                    <li key={loss} className="flex items-start gap-3">
                        {/* A hollow box, not a tick: these are the empty slots on the
                            account, and a checklist would read as things you have. */}
                        <span
                            aria-hidden
                            className="mt-[6px] size-[14px] shrink-0 border-[3px] border-ink/70"
                        />
                        <Text as="span" size="xs" tone="ember">
                            {loss}
                        </Text>
                    </li>
                ))}
            </ul>

            <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-3">
                <ButtonLink href={authPath(locale, "signUp")} tone="cream">
                    {copy.action}
                </ButtonLink>
                <Text size="xs" tone="ember">
                    {copy.keepsPrompt}{" "}
                    <TextLink
                        href={authPath(locale, "signIn")}
                        tone="ash"
                        weight="semibold"
                        className="text-cream hover:text-cream"
                    >
                        {copy.signIn}
                    </TextLink>
                </Text>
            </div>
        </Card>
    );
}
