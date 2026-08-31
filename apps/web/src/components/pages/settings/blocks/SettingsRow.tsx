import type { ReactNode } from "react";

import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import Eyebrow from "@/components/ui/typography/Eyebrow";
import { cn } from "@/lib/ui/cn";

type SettingsRowProps = {
    heading: string;
    body: string;
    /** The control this row is about — a switcher, a button, a link. */
    action?: ReactNode;
    /** Marks a row whose control does not exist yet. */
    soon?: string;
    /** Replaces the action, below the copy rather than beside it. */
    children?: ReactNode;
};

/**
 * One setting: what it is, what it does, and the control that does it.
 *
 * The control sits opposite the copy on a width that has room for both and
 * drops under it when it doesn't, rather than shrinking — a language switcher
 * squeezed to half a phone is harder to hit than one on its own line.
 *
 * A `soon` row keeps its heading and its explanation and simply has no control.
 * That is the honest shape for the two account actions with no endpoint behind
 * them: the player learns the setting exists and that it isn't here yet, which
 * is more than a hidden row tells them and less of a lie than a dead button.
 */
export default function SettingsRow({
    heading,
    body,
    action,
    soon,
    children,
}: SettingsRowProps) {
    return (
        <div
            className={cn(
                // No fill of its own: the panel around it already paints
                // `baize-deep`, and a row repeating it would be a second block
                // the same colour as the first.
                "flex flex-col gap-4 p-5 sm:p-6",
                soon && "opacity-70",
            )}
        >
            <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="flex items-baseline gap-3">
                        <Heading
                            surface="felt"
                            as="h2"
                            size="label"
                            tone="cream"
                        >
                            {heading}
                        </Heading>
                        {soon && (
                            <Eyebrow surface="felt" tone="mint">
                                {soon}
                            </Eyebrow>
                        )}
                    </div>
                    <Text
                        surface="felt"
                        size="sm"
                        tone={soon ? "mint" : "mintSoft"}
                    >
                        {body}
                    </Text>
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}
