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
import { forgetLobby } from "@/lib/game/last-lobby";
import { cn } from "@/lib/ui/cn";
import { panel } from "@/lib/ui/styles";
import type { Locale } from "@/lib/i18n/config";
import { authPath, profilePath, settingsPath } from "@/lib/navigation/routes";
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
 * A guest sees the account they don't have yet where the profile row would be.
 * That is not a placeholder: a guest has no profile — the name was issued by
 * the server and the API will not rename it — so the account is the honest
 * answer to the row they are looking for. Settings is still theirs; language
 * and signing out are not questions of who you are.
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
            // The remembered table belongs to the account that was sitting at
            // it. Left behind, the next person to sign in on this tab would be
            // rejoined to a stranger's lobby — see `last-lobby`.
            forgetLobby();
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
                className="flex min-w-0 cursor-pointer items-center gap-3 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-rust"
            >
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
                    className={cn(
                        panel,
                        "absolute top-[calc(100%+14px)] right-0 z-40 w-[268px] overflow-hidden",
                    )}
                >
                    {/* Who you are, before what you can do about it: the avatar repeats
                        at menu scale so the panel reads as belonging to the corner it
                        dropped out of. */}
                    <div className="flex min-w-0 items-center gap-3 border-b border-mint/15 p-4">
                        <UserAvatar
                            username={user.username}
                            avatarUrl={user.avatarUrl}
                            className="border-mint/30"
                        />
                        <div className="min-w-0">
                            <p className="truncate font-display text-[16px] font-extrabold tracking-[-.02em] text-cream">
                                {user.username}
                            </p>
                            <p className="truncate font-sans text-[13px] text-mint/80">
                                {user.email ?? copy.guestAccount}
                            </p>
                        </div>
                    </div>

                    {isGuest(user) ? (
                        <MenuItem
                            glyph={Sparkles}
                            href={authPath(locale, "signUp")}
                            onNavigate={() => setOpen(false)}
                            emphasis
                        >
                            {copy.createAccount}
                        </MenuItem>
                    ) : (
                        <MenuItem
                            glyph={UserRound}
                            href={profilePath(locale)}
                            onNavigate={() => setOpen(false)}
                        >
                            {copy.viewProfile}
                        </MenuItem>
                    )}
                    <MenuItem
                        glyph={Settings}
                        href={settingsPath(locale)}
                        onNavigate={() => setOpen(false)}
                    >
                        {copy.settings}
                    </MenuItem>
                    <MenuItem
                        glyph={LogOut}
                        onClick={signOut}
                        disabled={pending}
                    >
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
    /** Turns the row into a link. Mutually exclusive with `onClick`. */
    href?: string;
    /** Closes the menu behind a navigation that leaves it mounted. */
    onNavigate?: () => void;
    /** The one row worth colouring — at most one per menu. */
    emphasis?: boolean;
    onClick?: () => void;
    disabled?: boolean;
};

/** One row: a link where it navigates, a button where it acts. */
function MenuItem({
    glyph,
    children,
    href,
    onNavigate,
    emphasis,
    onClick,
    disabled,
}: MenuItemProps) {
    const content = (
        <>
            {/* `text-current` rather than a tone: the glyph then tracks the
                row it is in — mint at rest, cream under the pointer, cream on
                the one rust row — instead of standing at `Icon`'s own default,
                which is ink and all but invisible on the panel. */}
            <Icon glyph={glyph} size="sm" className="text-current" />
            <span className="mr-auto">{children}</span>
        </>
    );
    const className = cn(
        "flex w-full items-center gap-3 border-b border-mint/15 px-4 py-[13px] text-left font-display text-[15px] font-extrabold text-mint last:border-b-0",
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
                        ? "hover:bg-rust/90 hover:text-cream focus-visible:outline-cream"
                        : "hover:bg-mint/10 hover:text-cream focus-visible:bg-mint/10",
                )}
            >
                {content}
            </Link>
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
                "hover:bg-mint/10 hover:text-cream focus-visible:bg-mint/10 disabled:pointer-events-none disabled:opacity-60",
            )}
        >
            {content}
        </button>
    );
}
