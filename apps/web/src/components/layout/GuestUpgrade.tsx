import { ButtonLink } from "@/components/controls/Button";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/ui/cn";
import type { Locale } from "@/lib/i18n/config";
import { authPath } from "@/lib/navigation/routes";

type GuestUpgradeProps = {
    copy: Dictionary["table"]["guestUpgrade"];
    locale: Locale;
    /** `compact` is the phone's version — see `RankMeter`, whose slot this takes. */
    variant?: "full" | "compact";
    className?: string;
};

/**
 * What a guest gets in the corner where a player with an account gets their
 * rating. The swap is the argument: there is no number to show because guest
 * games earn none, so the space says what it would take to have one.
 *
 * It stays quiet on purpose. The case for an account is made at length by the
 * lobby's `GuestBanner`; a bar with one line to give gets the label and the
 * door. The label is a word rather than a sentence — two lines of explanation
 * in a 52px bar read as a banner wedged into the chrome — and the button is cut
 * below the marketing header's weight so the corner stays a corner.
 */
export default function GuestUpgrade({
    copy,
    locale,
    variant = "full",
    className,
}: GuestUpgradeProps) {
    const compact = variant === "compact";

    return (
        <div className={cn("shrink-0 items-center gap-3", className)}>
            {/* The "Unranked" label is out while there is no rating anywhere in
                the app: with the rank meter gone from the signed-in corner, it
                labelled an absence nobody else is shown. The copy stays in the
                dictionary — put the span back the day ratings exist.
            {!compact && (
                <span className="hidden whitespace-nowrap font-sans text-[10px] font-bold tracking-[.12em] text-ash/80 uppercase xl:block">
                    {copy.label}
                </span>
            )} */}
            <ButtonLink
                href={authPath(locale, "signUp")}
                tone="rust"
                size="sm"
                className={cn(
                    "border-2",
                    compact
                        ? "px-3 py-[6px] text-[12px]"
                        : "px-4 py-[7px] text-[13px]",
                )}
            >
                {copy.action}
            </ButtonLink>
        </div>
    );
}
