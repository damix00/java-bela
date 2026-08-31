import Link from "next/link";

import type { User } from "@/api/types/user";
import { isGuest } from "@/api/types/user";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/ui/cn";
import { appGutters } from "@/lib/ui/styles";
import { homePath } from "@/lib/navigation/routes";
import Logo from "@/components/ui/brand/Logo";
import ProfileMenu from "@/components/layout/ProfileMenu";
import GuestUpgrade from "@/components/layout/GuestUpgrade";
// import RankMeter from "@/components/layout/RankMeter";
import { DesktopNavLinks, MobileNavLinks } from "@/components/layout/NavLinks";

type GameNavigationProps = {
    copy: Dictionary["table"];
    locale: Locale;
    user: User | null;
};

/**
 * Shared chrome for the lobby, the tables and the account pages.
 *
 * Stays a server component: only the destination lists need the pathname, and
 * they live in `NavLinks` so the rest of the bar — which is rendered from the
 * session the layout already read — costs the client nothing.
 */
export default function GameNavigation({
    copy,
    locale,
    user,
}: GameNavigationProps) {
    // A guest has no rating, so the corner that shows one has nothing true to
    // put there. It carries the way to earn one instead.
    const guest = user !== null && isGuest(user);

    return (
        <>
            <header
                className={cn(
                    "sticky top-0 z-20 border-b-4 border-ink bg-ink py-2 sm:py-3",
                    appGutters,
                )}
            >
                {/* The band is full-bleed; only its contents take the gutters, which is
            what puts the logo on the same edge as the table below it. */}
                {/* The row is only as tall as the avatar on a phone, where the bar is
            competing with the table for a screen that has none to spare; the
            desktop bar keeps the taller rhythm the marketing header sets. */}
                <div className="flex min-h-10 items-center gap-5 sm:min-h-13 sm:gap-9">
                    <Link
                        href={homePath(locale)}
                        className="shrink-0 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-rust"
                    >
                        <Logo dense tone="cream" />
                    </Link>

                    <DesktopNavLinks
                        copy={copy.nav}
                        locale={locale}
                        label={copy.navigationLabel}
                    />

                    {user ? (
                        <div className="ml-auto flex min-w-0 items-center gap-4 lg:gap-6">
                            {/* Progression rides the top bar rather than a card beside the
                table: the lobby body is for starting a game, and a rank a
                player only glances at doesn't need a column of its own. */}
                            {/* Two cuts of the same block, not one that hides: the phone
                gets a single line, and the width that has room for the season
                countdown gets the stacked version. */}
                            {guest ? (
                                <>
                                    <GuestUpgrade
                                        copy={copy.guestUpgrade}
                                        locale={locale}
                                        variant="compact"
                                        className="lg:hidden"
                                    />
                                    <GuestUpgrade
                                        copy={copy.guestUpgrade}
                                        locale={locale}
                                        className="hidden lg:flex"
                                    />
                                </>
                            ) : null}
                            {/* The rank meter is out until there is a rating
                                behind it. It said "Unrated / Unranked" — honest,
                                but a permanent nothing in the corner every
                                signed-in player looks at. The component and its
                                copy stay; this is the slot it comes back into.
                            ) : (
                                <>
                                    <RankMeter
                                        copy={copy}
                                        variant="compact"
                                        className="flex lg:hidden"
                                    />
                                    <RankMeter
                                        copy={copy}
                                        className="hidden lg:flex"
                                    />
                                </>
                            )} */}
                            {/* The account corner is a menu from `sm` up. Below that the
                bottom bar carries the avatar, and a second one up here would
                be two doors to the same room in a bar that has no room. */}
                            <ProfileMenu
                                user={user}
                                copy={copy.profileMenu}
                                locale={locale}
                                className="hidden sm:block"
                            />
                        </div>
                    ) : null}
                </div>
            </header>

            <MobileNavLinks
                copy={copy.nav}
                locale={locale}
                label={copy.mobileNavigationLabel}
                user={user}
                guest={guest}
            />
        </>
    );
}
