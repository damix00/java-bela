"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
    ChevronDown,
    LogOut,
    Settings,
    Sparkles,
    UserRound,
} from "lucide-react";

import { logout } from "@/actions/auth";
import { clearAuth } from "@/api/token-store";
import type { User } from "@/api/types/user";
import { isGuest } from "@/api/types/user";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n";
import { authPath } from "@/lib/routes";
import Icon from "@/components/ui/graphics/Icon";
import UserAvatar from "@/components/layout/UserAvatar";

type ProfileMenuProps = {
    user: User;
    copy: Dictionary["table"]["profileMenu"];
    locale: Locale;
    className?: string;
};

/**
 * The top bar's account corner, on the widths that have room for it.
 *
 * Sign-out used to sit in the lobby body, which put an account action inside
 * the one screen that is supposed to be about starting a game — and left the
 * tables with no way out at all. Everything to do with *who you are* now hangs
 * off the avatar, which is where a player already looks for it.
 *
 * The profile and settings rows are inert until those pages exist. They are
 * still drawn: the menu's shape is the point, and an item that appears later
 * moves the one under it.
 *
 * For a guest the menu opens on the one row that does work: the account they
 * don't have yet. It sits above the two inert rows because it is the answer to
 * why those two have nothing to show.
 */
export default function ProfileMenu({
    user,
    copy,
    locale,
    className,
}: ProfileMenuProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [pending, startTransition] = useTransition();
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    // A menu that stays open behind the thing you clicked next is worse than no
    // menu, so both dismissals are wired: the pointer leaving the panel, and the
    // key every dropdown on the web answers to.
    useEffect(() => {
        if (!open) return;

        function onPointerDown(event: PointerEvent) {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key !== "Escape") return;
            setOpen(false);
            // Escape puts the caller back where they were, rather than dropping
            // focus onto the document and stranding a keyboard user at the top.
            triggerRef.current?.focus();
        }

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    function signOut() {
        startTransition(async () => {
            await logout();
            // The action cleared the cookies and revoked the refresh family
            // server-side; this drops the access token the client still holds, so
            // `apiFetch` stops sending a token that is no longer ours.
            clearAuth();
            setOpen(false);
            // `refresh` is what makes the server components re-render and the lobby
            // fall back to its signed-out half.
            router.refresh();
        });
    }

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <button
                ref={triggerRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={copy.trigger}
                onClick={() => setOpen((wasOpen) => !wasOpen)}
                className="flex min-w-0 cursor-pointer items-center gap-3 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-rust">
                <span className="hidden max-w-48 truncate font-display text-[16px] font-extrabold tracking-[-.02em] text-cream min-[1400px]:block">
                    {user.username}
                </span>
                <UserAvatar
                    username={user.username}
                    avatarUrl={user.avatarUrl}
                />
                <Icon
                    glyph={ChevronDown}
                    size="sm"
                    tone="ash"
                    className={cn(
                        "hidden min-[1400px]:block",
                        "transition-transform duration-[80ms] ease-[steps(2)] motion-reduce:transition-none",
                        open && "rotate-180",
                    )}
                />
            </button>

            {open && (
                <div
                    role="menu"
                    aria-label={copy.trigger}
                    className="absolute top-[calc(100%+14px)] right-0 z-40 w-[268px] border-4 border-ink bg-cream shadow-hard">
                    {/* Who you are, before what you can do about it: the avatar repeats
                        at menu scale so the panel reads as belonging to the corner it
                        dropped out of. */}
                    <div className="flex min-w-0 items-center gap-3 border-b-4 border-ink p-4">
                        <UserAvatar
                            username={user.username}
                            avatarUrl={user.avatarUrl}
                            className="border-ink"
                        />
                        <div className="min-w-0">
                            <p className="truncate font-display text-[16px] font-extrabold tracking-[-.02em] text-ink">
                                {user.username}
                            </p>
                            <p className="truncate font-sans text-[13px] text-moss">
                                {user.email ?? copy.guestAccount}
                            </p>
                        </div>
                    </div>

                    {isGuest(user) ? (
                        <MenuItem
                            glyph={Sparkles}
                            href={authPath(locale, "signUp")}
                            onNavigate={() => setOpen(false)}
                            emphasis>
                            {copy.createAccount}
                        </MenuItem>
                    ) : (
                        <MenuItem glyph={UserRound} soon={copy.soon}>
                            {copy.viewProfile}
                        </MenuItem>
                    )}
                    <MenuItem glyph={Settings} soon={copy.soon}>
                        {copy.settings}
                    </MenuItem>
                    <MenuItem
                        glyph={LogOut}
                        onClick={signOut}
                        disabled={pending}>
                        {copy.signOut}
                    </MenuItem>
                </div>
            )}
        </div>
    );
}

type MenuItemProps = {
    glyph: typeof UserRound;
    children: string;
    /** Present on the rows whose page hasn't been built yet. */
    soon?: string;
    /** Turns the row into a link. Mutually exclusive with `onClick`. */
    href?: string;
    /** Closes the menu behind a navigation that leaves it mounted. */
    onNavigate?: () => void;
    /** The one row worth colouring — at most one per menu. */
    emphasis?: boolean;
    onClick?: () => void;
    disabled?: boolean;
};

/**
 * One row. With neither `onClick` nor `href` it is a `span` rather than a dead
 * button — nothing is going to happen when it is pressed, and a control that
 * takes focus to do nothing is a worse promise than a label that never claimed
 * to be one.
 */
function MenuItem({
    glyph,
    children,
    soon,
    href,
    onNavigate,
    emphasis,
    onClick,
    disabled,
}: MenuItemProps) {
    const inert = !onClick && !href;
    const content = (
        <>
            <Icon
                glyph={glyph}
                size="sm"
                className={cn(inert && "text-moss", emphasis && "text-cream")}
            />
            <span className="mr-auto">{children}</span>
            {soon && (
                <span className="font-sans text-[11px] tracking-[.1em] text-moss uppercase">
                    {soon}
                </span>
            )}
        </>
    );
    const className = cn(
        "flex w-full items-center gap-3 border-b-[3px] border-ink/15 px-4 py-[13px] text-left font-display text-[15px] font-extrabold text-ink last:border-b-0",
        emphasis && "bg-rust text-cream",
    );
    const interactive =
        "cursor-pointer focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-rust";

    if (href) {
        return (
            <Link
                role="menuitem"
                href={href}
                onClick={onNavigate}
                className={cn(
                    className,
                    interactive,
                    "no-underline",
                    emphasis
                        ? "hover:bg-rust/90 hover:text-cream focus-visible:outline-ink"
                        : "hover:bg-sage focus-visible:bg-sage",
                )}>
                {content}
            </Link>
        );
    }

    if (!onClick) {
        return (
            <span
                role="menuitem"
                aria-disabled="true"
                className={cn(className, "text-moss")}>
                {content}
            </span>
        );
    }

    return (
        <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={onClick}
            className={cn(
                className,
                interactive,
                "hover:bg-sage focus-visible:bg-sage disabled:pointer-events-none disabled:opacity-60",
            )}>
            {content}
        </button>
    );
}
