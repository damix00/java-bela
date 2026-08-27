"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/ui/cn";
import { focusRing } from "@/lib/ui/styles";
import {
    LOCALE_COOKIE,
    type Locale,
    isLocale,
    localeNames,
    locales,
} from "@/lib/i18n/config";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

type LanguageSwitcherProps = {
    current: Locale;
    /** Names the group for screen readers — "Language" / "Jezik". */
    label: string;
    /**
     * Renders plain anchors instead of routed links, forcing a full page load.
     * Same escape hatch as `TextLink`'s prop of this name, for the same reason:
     * on a standalone auth page a routed hop to `/hr/sign-in` is a client-side
     * navigation, which is exactly what `@modal/(.)sign-in` intercepts — so
     * switching language would reopen the page as a modal over itself.
     */
    hardNavigation?: boolean;
    className?: string;
};

/**
 * Two real links, not buttons: both language URLs stay crawlable, and a
 * middle-click or a copied address carries the language with it. The cookie is
 * written on the way out so the *next* visit to a bare `/` lands here again.
 */
export default function LanguageSwitcher({
    current,
    label,
    hardNavigation = false,
    className,
}: LanguageSwitcherProps) {
    const pathname = usePathname();
    const Tag = hardNavigation ? "a" : Link;

    return (
        <nav
            aria-label={label}
            className={cn(
                "flex border-[3px] border-ink bg-cream font-display text-[13px]",
                className,
            )}
        >
            {locales.map((locale) => {
                const isCurrent = locale === current;

                return (
                    <Tag
                        key={locale}
                        href={swapLocale(pathname, locale)}
                        hrefLang={locale}
                        lang={locale}
                        aria-current={isCurrent ? "true" : undefined}
                        aria-label={localeNames[locale]}
                        onClick={() => rememberLocale(locale)}
                        className={cn(
                            focusRing,
                            // Divider between the two halves rather than a border on each,
                            // so the pair reads as one boxed control.
                            "border-l-[3px] border-ink px-3 py-1.5 no-underline uppercase first:border-l-0",
                            isCurrent
                                ? "bg-ink font-bold text-cream"
                                : "text-moss hover:bg-sage",
                        )}
                    >
                        {locale}
                    </Tag>
                );
            })}
        </nav>
    );
}

/** Rewrites the leading segment, so switching keeps you on the same page. */
function swapLocale(pathname: string, locale: Locale) {
    const segments = pathname.split("/");
    // segments[0] is the empty string before the leading slash.
    if (isLocale(segments[1] ?? "")) {
        segments[1] = locale;
        return segments.join("/");
    }

    return `/${locale}${pathname === "/" ? "" : pathname}`;
}

function rememberLocale(locale: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax`;
}
