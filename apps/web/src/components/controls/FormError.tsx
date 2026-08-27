import { cn } from "@/lib/ui/cn";

type FormErrorProps = {
    children: string;
    className?: string;
};

/**
 * What the *form* says when the server turns it away — a wrong password, an
 * email already taken, a backend that didn't answer. Distinct from
 * `FieldError`, which belongs to one control and hangs off its rust frame:
 * this one has no field to point at, so it takes a filled block of its own at
 * the top of the form where the eye lands before re-reading the fields.
 *
 * `role="alert"` for the same reason: it is the answer to a submit the player
 * just pressed.
 */
export default function FormError({ children, className }: FormErrorProps) {
    return (
        <p
            role="alert"
            className={cn(
                "m-0 border-4 border-ink bg-rust px-4 py-3 text-[13px] font-semibold text-cream",
                className,
            )}
        >
            {children}
        </p>
    );
}
