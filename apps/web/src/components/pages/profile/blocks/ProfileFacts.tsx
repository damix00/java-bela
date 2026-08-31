import Flag from "@/components/ui/graphics/Flag";
import DividedPanel from "@/components/ui/surfaces/DividedPanel";
import Eyebrow from "@/components/ui/typography/Eyebrow";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";
import { countryName } from "@/lib/i18n/countries";
import type { Locale } from "@/lib/i18n/config";

type ProfileFactsProps = {
    email: string | null;
    countryCode: string | null;
    createdAt: string;
    copy: Dictionary["profile"];
    locale: Locale;
};

/**
 * The account's facts, in the rhythm the settings rows already set: label on
 * the left, value on the right, a 4px rule between each.
 *
 * These used to be crammed into the identity strip beside the name, where the
 * email in particular read as part of the player's presentation rather than as
 * a detail of the account. Standing on their own they also give the page a
 * middle: banner, facts, form, instead of a banner with a long form under it.
 *
 * Every row is a stored value read back, which is why the join date appears
 * here as well as on the banner — the banner says it as part of a sentence
 * about the player, this says it as a field.
 */
export default function ProfileFacts({
    email,
    countryCode,
    createdAt,
    copy,
    locale,
}: ProfileFactsProps) {
    const joined = new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(new Date(createdAt));

    const country = countryCode
        ? countryName(locale, countryCode)
        : copy.countryNone;

    return (
        <DividedPanel surface="felt">
            <Row label={copy.emailLabel}>{email}</Row>
            <Row label={copy.countryLabel} flag={countryCode}>
                {country}
            </Row>
            <Row label={copy.memberSince}>{joined}</Row>
        </DividedPanel>
    );
}

function Row({
    label,
    flag,
    children,
}: {
    label: string;
    /** Drawn before the value, for the one row that has a country in it. */
    flag?: string | null;
    children: string | null;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-4 sm:px-6">
            <Eyebrow surface="felt" tone="mint">
                {label}
            </Eyebrow>
            <div className="flex min-w-0 items-center gap-2">
                {flag && <Flag code={flag} />}
                <Text
                    surface="felt"
                    size="sm"
                    tone="cream"
                    className="min-w-0 truncate"
                >
                    {children}
                </Text>
            </div>
        </div>
    );
}
