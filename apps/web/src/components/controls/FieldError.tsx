import { cn } from "@/lib/cn";

type FieldErrorProps = {
    /** The id the offending control points at with `aria-describedby`. */
    id: string;
    children: string;
    className?: string;
};

/**
 * The one line a field says when it won't accept what's in it. Same
 * 12px as the rule it replaces, in rust rather than stone — the note under
 * the field changes colour and wording, it doesn't change place, so nothing
 * on the card shifts when validation lands.
 *
 * `role="alert"` rather than a polite live region: the message is the answer
 * to a submit the player just pressed, so it is worth interrupting for.
 */
export default function FieldError({
    id,
    children,
    className,
}: FieldErrorProps) {
    return (
        <p
            id={id}
            role="alert"
            className={cn(
                "m-0 flex items-center gap-[9px] pt-[3px] text-[12px] font-semibold text-rust",
                className,
            )}
        >
            <span
                aria-hidden
                className="size-3.5 shrink-0 border-[3px] border-ink bg-rust"
            />
            {children}
        </p>
    );
}
