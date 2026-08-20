import { Button } from "@/components/controls/Button";
import GuestBanner from "@/components/pages/lobby/blocks/GuestBanner";
import SignOutButton from "@/components/pages/lobby/blocks/SignOutButton";
import Card from "@/components/ui/surfaces/Card";
import Chip from "@/components/ui/surfaces/Chip";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import type { User } from "@/api/types/user";
import { isGuest } from "@/api/types/user";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";

type LobbyScreenProps = {
    /**
     * Never null. A signed-out visitor doesn't reach this screen at all — they
     * get the table mockup and the account form over it.
     */
    user: User;
    copy: Dictionary["lobby"];
    locale: Locale;
};

/**
 * Home for someone who is signed in: the shortest path back to a table.
 *
 * The table actions are inert in this pass — the lobby WebSocket lands next, so
 * they carry a visible "coming soon" chip rather than pretending to work.
 */
export default function LobbyScreen({ user, copy, locale }: LobbyScreenProps) {
    const t = copy.signedIn;

    return (
        <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col justify-center gap-8 px-5 py-10 sm:px-8 sm:py-16">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <Heading as="h1" size="cardHero">
                    {t.greeting} {user.username}
                </Heading>
                {/* The account menu in the top bar owns sign-out from `sm` up. It
                    stays here on a phone, where the bar's profile item is still
                    inert and this is the only way out. */}
                <SignOutButton
                    label={t.signOut}
                    className="ml-auto sm:hidden"
                />
            </div>

            {isGuest(user) && (
                <GuestBanner
                    copy={copy.guestBanner}
                    user={user}
                    locale={locale}
                />
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
        </main>
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
