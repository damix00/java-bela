import { Button, ButtonLink } from "@/components/controls/Button";
import GuestBanner from "@/components/pages/lobby/blocks/GuestBanner";
import GuestButton from "@/components/pages/lobby/blocks/GuestButton";
import SignOutButton from "@/components/pages/lobby/blocks/SignOutButton";
import Card from "@/components/ui/surfaces/Card";
import Chip from "@/components/ui/surfaces/Chip";
import LabeledRule from "@/components/ui/surfaces/LabeledRule";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import TextLink from "@/components/ui/typography/TextLink";
import type { User } from "@/api/types/user";
import { isGuest } from "@/api/types/user";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { authPath, landingPath } from "@/lib/routes";

type LobbyScreenProps = {
    /** Null when nobody is signed in — the session comes from the cookie jar. */
    user: User | null;
    copy: Dictionary["lobby"];
    errors: Dictionary["form"]["errors"];
    locale: Locale;
};

/**
 * The front door. Signed out it makes the case for an account and offers a seat
 * anyway; signed in it is the shortest path back to a table.
 *
 * The table actions are inert in this pass — the lobby WebSocket lands next, so
 * they carry a visible "coming soon" chip rather than pretending to work.
 */
export default function LobbyScreen({
    user,
    copy,
    errors,
    locale,
}: LobbyScreenProps) {
    return (
        <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col justify-center gap-8 px-5 py-10 sm:px-8 sm:py-16">
            {user ? (
                <SignedIn user={user} copy={copy} locale={locale} />
            ) : (
                <SignedOut
                    copy={copy.signedOut}
                    errors={errors}
                    locale={locale}
                />
            )}
        </main>
    );
}

function SignedOut({
    copy,
    errors,
    locale,
}: {
    copy: Dictionary["lobby"]["signedOut"];
    errors: Dictionary["form"]["errors"];
    locale: Locale;
}) {
    return (
        <Card padding="lg" shadow="rust" className="gap-7">
            <div className="flex flex-col gap-3">
                <Heading as="h1" size="cardHero" className="max-w-[20ch]">
                    {copy.heading}
                </Heading>
                <Text size="md" className="max-w-[46ch]">
                    {copy.body}
                </Text>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                {/* Plain links, so they are shareable URLs and open in a new tab like
            any other link. The interception is what turns a click into a
            modal — it is not something these need to know about. */}
                <ButtonLink
                    href={authPath(locale, "signIn")}
                    tone="forest"
                    size="lg">
                    {copy.signIn}
                </ButtonLink>
                <ButtonLink
                    href={authPath(locale, "signUp")}
                    tone="rust"
                    size="lg">
                    {copy.signUp}
                </ButtonLink>
            </div>

            <LabeledRule>{copy.guestNote}</LabeledRule>

            <div className="flex flex-wrap items-center gap-4">
                <GuestButton
                    label={copy.guest}
                    errors={errors}
                    locale={locale}
                />
                <TextLink href={landingPath(locale)} className="text-[15px]">
                    {copy.aboutLink}
                </TextLink>
            </div>
        </Card>
    );
}

function SignedIn({
    user,
    copy,
    locale,
}: {
    user: User;
    copy: Dictionary["lobby"];
    locale: Locale;
}) {
    const t = copy.signedIn;

    return (
        <>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <Heading as="h1" size="cardHero">
                    {t.greeting} {user.username}
                </Heading>
                <SignOutButton label={t.signOut} className="ml-auto" />
            </div>

            {isGuest(user) && (
                <GuestBanner copy={copy.guestBanner} locale={locale} />
            )}

            <div className="grid gap-6 sm:grid-cols-2">
                <TableAction
                    title={t.quickPlay}
                    note={t.quickPlayNote}
                    soon={t.soon}
                    tone="rust"
                />
                <TableAction
                    title={t.createTable}
                    note={t.createTableNote}
                    soon={t.soon}
                    tone="forest"
                />
            </div>

            <Card padding="md" className="gap-4">
                <Heading as="h2" size="card">
                    {t.joinTable}
                </Heading>
                <div className="flex flex-wrap items-center gap-3">
                    <Chip>{t.soon}</Chip>
                    <Text size="xs">{t.joinPlaceholder}</Text>
                </div>
            </Card>
        </>
    );
}

/**
 * One of the two big table buttons. Disabled rather than absent: the shape of
 * the lobby is the point, and a button that appears later moves everything
 * under it.
 */
function TableAction({
    title,
    note,
    soon,
    tone,
}: {
    title: string;
    note: string;
    soon: string;
    tone: "rust" | "forest";
}) {
    return (
        <Card padding="md" className="gap-4">
            <div className="flex items-center gap-3">
                <Heading as="h2" size="card" className="mr-auto">
                    {title}
                </Heading>
                <Chip>{soon}</Chip>
            </div>
            <Text size="xs" className="flex-1">
                {note}
            </Text>
            <Button tone={tone} size="md" disabled>
                {title}
            </Button>
        </Card>
    );
}
