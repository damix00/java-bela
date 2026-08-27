"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/ui/cn";
import type { Locale } from "@/lib/i18n/config";

/**
 * Keeps the shared app navigation out of the game itself.
 *
 * The lobby and play route share a layout so their socket-backed providers stay
 * mounted. That makes the current pathname the right boundary for route chrome:
 * the navigation remains server-rendered in `navigation`, while this small
 * client wrapper alone reacts when the route changes.
 */
export default function AppNavigationFrame({
    children,
    locale,
    navigation,
}: {
    children: ReactNode;
    locale: Locale;
    navigation: ReactNode;
}) {
    const pathname = usePathname();
    const playing = pathname.startsWith(`/${locale}/play/`);

    return (
        <>
            {playing ? null : navigation}
            <div
                className={cn(
                    "flex flex-1 flex-col",
                    playing
                        ? "h-dvh min-h-0 flex-none overflow-hidden overscroll-none"
                        : "pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-0",
                )}
            >
                {children}
            </div>
        </>
    );
}
