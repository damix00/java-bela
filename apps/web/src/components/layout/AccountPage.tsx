import type { ReactNode } from "react";

import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import { cn } from "@/lib/ui/cn";
import { appGutters } from "@/lib/ui/styles";

type AccountPageProps = {
    /**
     * Omitted by a page whose first block already names itself — the profile's
     * banner is its own `h1`, and a heading on the felt above it would be the
     * player's name said twice.
     */
    heading?: string;
    intro?: string;
    /** The cross-link to the other account page, opposite the heading. */
    action?: ReactNode;
    children: ReactNode;
};

/**
 * The frame profile and settings share.
 *
 * Both sit on the felt the `(app)` layout paints, so the page's own voice is
 * cream on green and everything below it is a block laid on top — the same
 * relationship the lobby has with the table. The column is capped at the width
 * the lobby's own band stops at, well short of the gutters: these are two pages
 * of reading and one form, and a form the full width of a desktop is a form
 * nobody's eye can follow across.
 */
export default function AccountPage({
    heading,
    intro,
    action,
    children,
}: AccountPageProps) {
    return (
        <main className={cn(appGutters, "flex-1 py-10 sm:py-14")}>
            <div className="mx-auto flex w-full max-w-[760px] flex-col gap-8">
                {heading && (
                    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                        <div className="flex min-w-0 flex-col gap-2">
                            <Heading
                                surface="felt"
                                as="h1"
                                size="cardHero"
                                tone="cream"
                            >
                                {heading}
                            </Heading>
                            {intro && (
                                <Text surface="felt" size="sm" tone="mint">
                                    {intro}
                                </Text>
                            )}
                        </div>
                        {action}
                    </header>
                )}
                {children}
            </div>
        </main>
    );
}
