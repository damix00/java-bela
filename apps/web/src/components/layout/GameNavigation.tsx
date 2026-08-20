import Link from "next/link";
import { History, Table2, Trophy, Users } from "lucide-react";

import type { User } from "@/api/types/user";
import { isGuest } from "@/api/types/user";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { appGutters } from "@/lib/styles";
import { homePath } from "@/lib/routes";
import Logo from "@/components/ui/brand/Logo";
import Icon from "@/components/ui/graphics/Icon";
import UserAvatar from "@/components/layout/UserAvatar";
import ProfileMenu from "@/components/layout/ProfileMenu";
import GuestUpgrade from "@/components/layout/GuestUpgrade";
import RankMeter from "@/components/layout/RankMeter";

type GameNavigationProps = {
    copy: Dictionary["table"];
    locale: Locale;
    user: User | null;
};

const destinations = [
    { key: "table", glyph: Table2, available: true },
    { key: "ladder", glyph: Trophy, available: false },
    { key: "friends", glyph: Users, available: false },
    { key: "hands", glyph: History, available: false },
] as const;

const barItem =
    "flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-3 font-sans text-[10px] font-bold tracking-[.08em] uppercase";

/** Shared chrome for the lobby and every table route. */
export default function GameNavigation({
    copy,
    locale,
    user,
}: GameNavigationProps) {
    const lobbyHref = homePath(locale);
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
                        href={lobbyHref}
                        className="shrink-0 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-rust"
                    >
                        <Logo withMark dense tone="cream" />
                    </Link>

                    <nav
                        aria-label={copy.navigationLabel}
                        className="hidden shrink-0 items-center gap-6 sm:flex lg:gap-7"
                    >
                        {destinations.map((destination) => {
                            const label = copy.nav[destination.key];
                            const className = cn(
                                "border-b-[3px] pb-[3px] font-sans text-[12px] font-bold tracking-[.14em] uppercase",
                                destination.available
                                    ? "border-rust text-cream"
                                    : "border-transparent text-ash/80",
                            );

                            return destination.available ? (
                                <Link
                                    key={destination.key}
                                    href={lobbyHref}
                                    aria-current="page"
                                    className={cn(
                                        className,
                                        "focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-rust",
                                    )}
                                >
                                    {label}
                                </Link>
                            ) : (
                                <span
                                    key={destination.key}
                                    aria-disabled="true"
                                    className={className}
                                >
                                    {label}
                                </span>
                            );
                        })}
                    </nav>

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
                            )}
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

            <nav
                aria-label={copy.mobileNavigationLabel}
                className={cn(
                    "fixed inset-x-0 bottom-0 z-30 grid border-t-4 border-ink bg-ink pb-[env(safe-area-inset-bottom)] sm:hidden",
                    user ? "grid-cols-5" : "grid-cols-4",
                )}
            >
                {destinations.map((destination) => {
                    const label = copy.nav[destination.key];
                    const content = (
                        <>
                            <Icon
                                glyph={destination.glyph}
                                size="sm"
                                tone={destination.available ? "cream" : "ash"}
                            />
                            <span>{label}</span>
                        </>
                    );
                    const className = cn(
                        barItem,
                        destination.available
                            ? "border-t-4 border-rust text-cream"
                            : "border-t-4 border-transparent text-ash/70",
                    );

                    return destination.available ? (
                        <Link
                            key={destination.key}
                            href={lobbyHref}
                            aria-current="page"
                            className={cn(
                                className,
                                "focus-visible:outline-4 focus-visible:outline-inset focus-visible:outline-rust",
                            )}
                        >
                            {content}
                        </Link>
                    ) : (
                        <span
                            key={destination.key}
                            aria-disabled="true"
                            className={className}
                        >
                            {content}
                        </span>
                    );
                })}

                {/* The account, wearing its own face. The avatar is the one glyph in
            this bar a player recognises before reading the label under it —
            which is what earns it the fifth slot on a screen this narrow. It
            is inert for now, like the three destinations beside it. */}
                {user ? (
                    <span
                        aria-disabled="true"
                        className={cn(
                            barItem,
                            "border-t-4 border-transparent text-ash/70",
                        )}
                    >
                        <UserAvatar
                            user={user}
                            size="sm"
                            className="border-ash/70 opacity-80"
                        />
                        <span>{copy.nav.profile}</span>
                    </span>
                ) : null}
            </nav>
        </>
    );
}
