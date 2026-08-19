import type { ReactNode } from "react";

import FieldError from "@/components/controls/FieldError";
import Eyebrow from "@/components/ui/typography/Eyebrow";
import Text from "@/components/ui/typography/Text";
import { cn } from "@/lib/cn";

type FieldProps = {
    /** Must match the `id` of the control passed as `children`. */
    htmlFor: string;
    label: string;
    /** Sits opposite the label — a "Forgot?" link, a character count. */
    action?: ReactNode;
    /** Note under the field: a rule, a hint, a validation line. */
    hint?: ReactNode;
    /**
     * Validation message. Takes the hint's place while it is set: the two say
     * the same thing about the same field, and the rule is no longer the news
     * once the field has been rejected.
     */
    error?: string;
    children: ReactNode;
    className?: string;
};

/** The id a field's error line takes, for the control to point at. */
export function errorId(htmlFor: string) {
    return `${htmlFor}-error`;
}

/**
 * What a control has to say about itself once its field has been rejected:
 * the flag the rust frame hangs off, and the pointer to the line explaining
 * it. Spread onto the control next to its `register` props.
 */
export function invalidProps(htmlFor: string, error?: { message?: string }) {
    if (!error) return {};

    return {
        "aria-invalid": true,
        "aria-describedby": errorId(htmlFor),
    } as const;
}

/** A labelled field: caps label on top, control, optional note underneath. */
export default function Field({
    htmlFor,
    label,
    action,
    hint,
    error,
    children,
    className,
}: FieldProps) {
    return (
        <div className={cn("flex flex-col gap-[7px]", className)}>
            <div className="flex items-baseline gap-3">
                <Eyebrow as="label" htmlFor={htmlFor} className="mr-auto">
                    {label}
                </Eyebrow>
                {action}
            </div>
            {children}
            {/* A string gets the standard hint treatment; a node — the password
          rule, the strength meter — is trusted to style itself. */}
            {error ? (
                <FieldError id={errorId(htmlFor)}>{error}</FieldError>
            ) : typeof hint === "string" ? (
                <Text size="xs">{hint}</Text>
            ) : (
                hint
            )}
        </div>
    );
}
