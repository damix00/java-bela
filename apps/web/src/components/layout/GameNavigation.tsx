import Link from "next/link";
import { History, Table2, Trophy, Users } from "lucide-react";

import type { User } from "@/api/types/user";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { appGutters } from "@/lib/styles";
import { homePath } from "@/lib/routes";
import Logo from "@/components/ui/brand/Logo";
import Icon from "@/components/ui/graphics/Icon";
import UserAvatar from "@/components/layout/UserAvatar";
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

/** Shared chrome for the lobby and every table route. */
export default function GameNavigation({
    copy,
    locale,
    user,
}: GameNavigationProps) {
    const lobbyHref = homePath(locale);

    return (
        <>
            <header
                className={cn(
                    "sticky top-0 z-20 border-b-4 border-ink bg-ink py-2 sm:py-3",
                    appGutters,
                )}>
                {/* The band is full-bleed; only its contents take the gutters, which is
            what puts the logo on the same edge as the table below it. */}
                {/* The row is only as tall as the avatar on a phone, where the bar is
            competing with the table for a screen that has none to spare; the
            desktop bar keeps the taller rhythm the marketing header sets. */}
                <div className="flex min-h-10 items-center gap-5 sm:min-h-13 sm:gap-9">
                    <Link
                        href={lobbyHref}
                        className="shrink-0 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-rust">
                        <Logo withMark dense tone="cream" />
                    </Link>

                    <nav
                        aria-label={copy.navigationLabel}
                        className="hidden shrink-0 items-center gap-6 sm:flex lg:gap-7">
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
                                    )}>
                                    {label}
                                </Link>
                            ) : (
                                <span
                                    key={destination.key}
                                    aria-disabled="true"
                                    className={className}>
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
                            <RankMeter copy={copy} className="hidden lg:flex" />
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="max-w-24 truncate font-display text-[15px] font-extrabold tracking-[-.02em] text-cream sm:max-w-48 sm:text-[16px]">
                                    {user.username}
                                </span>
                                <UserAvatar user={user} />
                            </div>
                        </div>
                    ) : null}
                </div>
            </header>

            <nav
                aria-label={copy.mobileNavigationLabel}
                className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t-4 border-ink bg-ink pb-[env(safe-area-inset-bottom)] sm:hidden">
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
                        "flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-3 font-sans text-[10px] font-bold tracking-[.08em] uppercase",
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
                            )}>
                            {content}
                        </Link>
                    ) : (
                        <span
                            key={destination.key}
                            aria-disabled="true"
                            className={className}>
                            {content}
                        </span>
                    );
                })}
            </nav>
        </>
    );
}
