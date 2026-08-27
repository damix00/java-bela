import Eyebrow from "@/components/ui/typography/Eyebrow";
import { cn } from "@/lib/ui/cn";
import { focusRing, pressSm } from "@/lib/ui/styles";

/** The suits, plus a star for anyone who doesn't want to declare one. */
export const AVATAR_GLYPHS = ["♠", "♥", "♦", "♣", "★"] as const;

type AvatarPickerProps = {
    label: string;
    /** Index into `AVATAR_GLYPHS`. */
    value: number;
    onChange: (index: number) => void;
    /** Names each tile for screen readers: "Avatar 1", "Avatar 2"… */
    optionLabel: string;
    /** Sits opposite the label — the profile marks the picker "coming soon". */
    badge?: string;
};

/**
 * Five tiles, one chosen. The chosen one is the only tile with a fill and a
 * shadow — it stands off the page while the rest stay flat against it, so the
 * choice is legible without a tick.
 */
export default function AvatarPicker({
    label,
    value,
    onChange,
    optionLabel,
    badge,
}: AvatarPickerProps) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
                <Eyebrow id="avatar-label" className="mr-auto">
                    {label}
                </Eyebrow>
                {badge && <Eyebrow>{badge}</Eyebrow>}
            </div>
            <div
                role="radiogroup"
                aria-labelledby="avatar-label"
                className="flex flex-wrap gap-2 sm:gap-3.5"
            >
                {AVATAR_GLYPHS.map((glyph, index) => {
                    const picked = index === value;

                    return (
                        <button
                            key={glyph}
                            type="button"
                            role="radio"
                            aria-checked={picked}
                            aria-label={`${optionLabel} ${index + 1}`}
                            onClick={() => onChange(index)}
                            className={cn(
                                focusRing,
                                picked && pressSm,
                                "grid size-12 cursor-pointer place-items-center rounded-none border-4 border-ink font-display text-[21px] leading-none sm:size-14 sm:text-[24px]",
                                picked
                                    ? "bg-rust text-cream shadow-hard-sm"
                                    : "bg-white text-ink",
                            )}
                        >
                            <span aria-hidden>{glyph}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
