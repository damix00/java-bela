import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

const tones = {
    ink: "text-ink hover:text-ink",
    ash: "text-ash hover:text-cream",
} as const;

type TextLinkProps = ComponentProps<typeof Link> & {
    tone?: keyof typeof tones;
    weight?: "normal" | "semibold";
    /**
     * Renders a plain anchor instead of a routed link, forcing a full page load.
     *
     * The one thing this is for: a link between two standalone auth pages.
     * Route interception keys off client-side navigation, so a routed hop from
     * `/sign-in` to `/sign-up` would open the sign-up *modal* stacked on top of
     * the sign-in page. Leaving the router is what tells Next this is a fresh
     * arrival at a real page.
     */
    hardNavigation?: boolean;
    replace?: boolean;
};

/**
 * Routed link: the auth screens navigate between real pages, so every one of
 * these goes through the router. In-page anchors work through it unchanged.
 */
export default function TextLink({
    tone = "ink",
    weight = "normal",
    hardNavigation = false,
    replace = false,
    className,
    ...props
}: TextLinkProps) {
    const Tag = hardNavigation ? "a" : Link;

    return (
        <Tag
            replace={Tag == "a" ? undefined : replace}
            className={cn(
                "text-[15px] no-underline hover:underline hover:decoration-[3px] hover:underline-offset-[5px]",
                tones[tone],
                weight === "semibold" && "font-semibold",
                className,
            )}
            {...props}
            href={
                typeof props.href === "string" ? props.href : String(props.href)
            }
        />
    );
}
