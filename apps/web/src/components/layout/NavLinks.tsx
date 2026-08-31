"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Table2, Trophy, Users } from "lucide-react";

import type { User } from "@/api/types/user";
import UserAvatar from "@/components/layout/UserAvatar";
import Icon from "@/components/ui/graphics/Icon";
import { cn } from "@/lib/ui/cn";
import type { Locale } from "@/lib/i18n/config";
import { homePath, profilePath, settingsPath } from "@/lib/navigation/routes";

type NavCopy = {
    table: string;
    ladder: string;
    friends: string;
    hands: string;
    profile: string;
    settings: string;
};

const destinations = [
    { key: "table", glyph: Table2, available: true },
    { key: "ladder", glyph: Trophy, available: false },
    { key: "friends", glyph: Users, available: false },
    { key: "hands", glyph: History, available: false },
] as const;

const barItem =
    "flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-3 font-sans text-[10px] font-bold tracking-[.08em] uppercase portrait-sm:gap-0.5 portrait-sm:py-2";

/**
 * Which destination the current URL belongs to.
 *
 * The lobby is the only destination that owns a bare path, so it has to match
 * exactly — a `startsWith` on `/en` would claim every page in the app,
 * including the two this component now links to.
 */
function useActiveKey(locale: Locale) {
    const pathname = usePathname();

    if (pathname === homePath(locale)) return "table";
    // One key for both account pages: they are one destination as far as the
    // bar is concerned, and they link to each other.
    if (
        pathname.startsWith(profilePath(locale)) ||
        pathname.startsWith(settingsPath(locale))
    ) {
        return "account";
    }

    return null;
}

/**
 * The desktop nav row.
 *
 * Client-side purely to read the pathname: the current page is now something
 * the URL decides rather than a constant, because the account pages are the
 * first destinations in this bar a player can actually be standing on that
 * aren't the lobby.
 */
export function DesktopNavLinks({
    copy,
    locale,
    label,
}: {
    copy: NavCopy;
    locale: Locale;
    label: string;
}) {
    const active = useActiveKey(locale);

    return (
        <nav
            aria-label={label}
            className="hidden shrink-0 items-center gap-6 sm:flex lg:gap-7"
        >
            {destinations.map((destination) => {
                const current = active === destination.key;
                const className = cn(
                    "border-b-[3px] pb-[3px] font-sans text-[12px] font-bold tracking-[.14em] uppercase",
                    !destination.available && "border-transparent text-ash/80",
                    destination.available &&
                        (current
                            ? "border-rust text-cream"
                            : "border-transparent text-ash hover:text-cream"),
                );

                return destination.available ? (
                    <Link
                        key={destination.key}
                        href={homePath(locale)}
                        aria-current={current ? "page" : undefined}
                        className={cn(
                            className,
                            "focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-rust",
                        )}
                    >
                        {copy[destination.key]}
                    </Link>
                ) : (
                    <span
                        key={destination.key}
                        aria-disabled="true"
                        className={className}
                    >
                        {copy[destination.key]}
                    </span>
                );
            })}
        </nav>
    );
}

/**
 * The phone's bottom bar.
 *
 * The account gets the fifth slot wearing its own face: the avatar is the one
 * glyph here a player recognises before reading the label under it. It is the
 * only account door on a phone — the avatar menu is desktop-only — so it has to
 * lead somewhere for everyone, which is why a guest, who has no profile, gets
 * settings behind the same tile.
 *
 * Settings never gets a sixth slot of its own. The bar has no room for one, and
 * the two account pages link to each other.
 */
export function MobileNavLinks({
    copy,
    locale,
    label,
    user,
    guest,
}: {
    copy: NavCopy;
    locale: Locale;
    label: string;
    user: User | null;
    guest: boolean;
}) {
    const active = useActiveKey(locale);
    const accountHref = guest ? settingsPath(locale) : profilePath(locale);
    const accountLabel = guest ? copy.settings : copy.profile;

    return (
        <nav
            aria-label={label}
            className={cn(
                "fixed inset-x-0 bottom-0 z-30 grid border-t-4 border-ink bg-ink pb-[env(safe-area-inset-bottom)] sm:hidden",
                user ? "grid-cols-5" : "grid-cols-4",
            )}
        >
            {destinations.map((destination) => {
                const current = active === destination.key;
                const content = (
                    <>
                        <Icon
                            glyph={destination.glyph}
                            size="sm"
                            tone={destination.available ? "cream" : "ash"}
                        />
                        <span>{copy[destination.key]}</span>
                    </>
                );
                const className = cn(
                    barItem,
                    "border-t-4",
                    !destination.available && "border-transparent text-ash/70",
                    destination.available &&
                        (current
                            ? "border-rust text-cream"
                            : "border-transparent text-ash"),
                );

                return destination.available ? (
                    <Link
                        key={destination.key}
                        href={homePath(locale)}
                        aria-current={current ? "page" : undefined}
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

            {user ? (
                <Link
                    href={accountHref}
                    aria-current={active === "account" ? "page" : undefined}
                    className={cn(
                        barItem,
                        "border-t-4 focus-visible:outline-4 focus-visible:outline-inset focus-visible:outline-rust",
                        active === "account"
                            ? "border-rust text-cream"
                            : "border-transparent text-ash",
                    )}
                >
                    <UserAvatar
                        username={user.username}
                        avatarUrl={user.avatarUrl}
                        size="sm"
                        className={cn(
                            active === "account"
                                ? "border-cream"
                                : "border-ash/70 opacity-80",
                        )}
                    />
                    <span>{accountLabel}</span>
                </Link>
            ) : null}
        </nav>
    );
}
