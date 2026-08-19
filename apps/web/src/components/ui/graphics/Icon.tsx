import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

const sizes = {
    sm: "size-[18px]",
    md: "size-6",
    lg: "size-8",
    xl: "size-12",
} as const;

const tones = {
    ink: "text-ink",
    cream: "text-cream",
    rust: "text-rust",
    forest: "text-forest",
    mint: "text-mint",
    ember: "text-ember",
    ash: "text-ash",
} as const;

type IconProps = {
    glyph: LucideIcon;
    size?: keyof typeof sizes;
    tone?: keyof typeof tones;
    className?: string;
};

/**
 * Lucide glyph tuned to the page: heavy stroke so it sits next to the 3–4px
 * ink borders instead of disappearing between them.
 */
export default function Icon({
    glyph: Glyph,
    size = "md",
    tone = "ink",
    className,
}: IconProps) {
    return (
        <Glyph
            aria-hidden
            strokeWidth={2.5}
            className={cn("shrink-0", sizes[size], tones[tone], className)}
        />
    );
}

const badgeTones = {
    cream: "bg-cream",
    sage: "bg-sage",
    rust: "bg-rust",
    forest: "bg-forest",
    ink: "bg-ink",
} as const;

type IconBadgeProps = Omit<IconProps, "tone"> & {
    /** Box fill. The glyph tone follows from it unless overridden. */
    tone?: keyof typeof badgeTones;
    glyphTone?: keyof typeof tones;
};

const badgeGlyphTones: Record<keyof typeof badgeTones, keyof typeof tones> = {
    cream: "ink",
    sage: "ink",
    rust: "cream",
    forest: "cream",
    ink: "cream",
};

/** Icon in its own boxed tile — the ornament version, for cards and lists. */
export function IconBadge({
    glyph,
    size = "md",
    tone = "cream",
    glyphTone,
    className,
}: IconBadgeProps) {
    return (
        <span
            className={cn(
                "grid size-11 shrink-0 place-items-center border-[3px] border-ink",
                badgeTones[tone],
                className,
            )}
        >
            <Icon
                glyph={glyph}
                size={size}
                tone={glyphTone ?? badgeGlyphTones[tone]}
            />
        </span>
    );
}
