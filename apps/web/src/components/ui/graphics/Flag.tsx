import { flagSrc } from "@/lib/i18n/countries";
import { cn } from "@/lib/ui/cn";

const sizes = {
    /** Beside a line of body copy or in a list row. */
    sm: "w-5",
    /** Beside the name on the profile banner. */
    md: "w-7",
} as const;

type FlagProps = {
    /** ISO 3166-1 alpha-2, in either case. Null draws nothing. */
    code: string | null;
    /**
     * The country's name, for the places the flag stands alone. Left off — the
     * usual case — it is decoration beside a name already written out, and is
     * hidden from screen readers rather than read as a second copy of it.
     */
    label?: string;
    size?: keyof typeof sizes;
    className?: string;
};

/**
 * One country's flag, drawn by Twemoji.
 *
 * Deliberately a plain `<img>`. These are static SVGs of a few hundred bytes
 * served straight out of `public/`, and `next/image` neither optimises SVG nor
 * has anything to add to a 20px square — it would put a wrapper and a layout
 * pass around a file the browser already has.
 *
 * No frame around it. Twemoji draws its flags with their own rounded edge, so
 * a hairline on top of that reads as a box someone put the flag in rather than
 * as the flag's own outline.
 */
export default function Flag({
    code,
    label,
    size = "sm",
    className,
}: FlagProps) {
    const src = code ? flagSrc(code) : null;
    if (!src) return null;

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={label ?? ""}
            aria-hidden={label ? undefined : "true"}
            width={28}
            height={28}
            className={cn(
                "inline-block h-auto shrink-0 object-contain",
                sizes[size],
                className,
            )}
        />
    );
}
