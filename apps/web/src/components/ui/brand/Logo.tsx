import { cn } from "@/lib/cn";

const tones = {
    ink: "text-ink",
    cream: "text-cream",
} as const;

// The badge inverts against whatever it sits on, so the spade always reads.
const markTones = {
    ink: "bg-ink text-cream",
    cream: "bg-cream text-ink",
} as const;

type LogoProps = {
    /** The tilted spade badge only appears where there's room for it. */
    withMark?: boolean;
    /**
     * Step the whole lockup down on phones.
     *
     * For the bars that have to share a phone screen with the thing the page is
     * actually for — the game chrome, where the top bar is 60px and every pixel
     * of it is taken from the table. The marketing header has a screen to itself
     * and keeps the full size at every width.
     */
    dense?: boolean;
    tone?: keyof typeof tones;
    className?: string;
};

export default function Logo({
    withMark = false,
    dense = false,
    tone = "ink",
    className,
}: LogoProps) {
    return (
        <span
            className={cn(
                "flex items-center",
                dense ? "gap-2 sm:gap-[11px]" : "gap-[11px]",
                className,
            )}
        >
            {withMark && (
                <span
                    aria-hidden
                    className={cn(
                        "grid -rotate-6 place-items-center",
                        dense
                            ? "size-7 text-[15px] sm:size-9 sm:text-[19px]"
                            : "size-9 text-[19px]",
                        markTones[tone],
                    )}
                >
                    ♠
                </span>
            )}
            <span
                className={cn(
                    "font-display font-extrabold tracking-[-.02em]",
                    dense ? "text-[17px] sm:text-[21px]" : "text-[21px]",
                    tones[tone],
                )}
            >
                belote.gg
            </span>
        </span>
    );
}
