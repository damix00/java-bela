import { ButtonLink } from "@/components/controls/Button";
import Card from "@/components/ui/surfaces/Card";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { authPath } from "@/lib/routes";

type GuestBannerProps = {
    copy: Dictionary["lobby"]["guestBanner"];
    locale: Locale;
};

/**
 * Shown to guests, and only to guests. The backend sweeps anonymous accounts
 * after 24 hours and their refresh token is cut to match, so a guest who
 * enjoys themselves and comes back tomorrow finds nothing — this is the one
 * prompt standing between that and a kept player.
 */
export default function GuestBanner({ copy, locale }: GuestBannerProps) {
    return (
        <Card tone="sage" padding="md" shadow="rust" className="gap-3">
            <Heading as="h2" size="label">
                {copy.heading}
            </Heading>
            <Text size="xs" className="max-w-[52ch]">
                {copy.body}
            </Text>
            <ButtonLink
                href={authPath(locale, "signUp")}
                tone="rust"
                size="sm"
                className="self-start"
            >
                {copy.action}
            </ButtonLink>
        </Card>
    );
}
