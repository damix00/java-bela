import { cn } from "@/lib/cn";

const tones = {
    ink: "text-ink",
    cream: "text-cream",
} as const;

type LogoProps = {
    /**
     * Step the wordmark down on phones.
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
    dense = false,
    tone = "ink",
    className,
}: LogoProps) {
    return (
        <span
            className={cn(
                "inline-flex items-baseline font-display leading-none font-black select-none",
                dense ? "text-[19px] sm:text-[23px]" : "text-[23px]",
                tones[tone],
                className,
            )}
        >
            <span className="tracking-[-.065em]">belote</span>
            <span className="relative -top-[.42em] ml-[.16em] text-[.56em] tracking-[-.025em]">
                <span className="text-rust">.</span>gg
            </span>
        </span>
    );
}
