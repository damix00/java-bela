import { ButtonLink } from "@/components/controls/Button";
import Text from "@/components/ui/typography/Text";
import TextLink from "@/components/ui/typography/TextLink";
import { cn } from "@/lib/ui/cn";
import type { Locale } from "@/lib/i18n/config";
import { authLink, landingSignUpPath } from "@/lib/navigation/routes";

type JoinCtaProps = {
    /** The band's own verb — no two of these read the same. */
    label: string;
    locale: Locale;
    /** Whichever of the two reads as an accent against the band behind it. */
    tone?: "forest" | "rust";
    /**
     * The quiet way back for someone who already has an account. Only the hero
     * carries it; further down the page, the header is still one scroll away.
     */
    signIn?: { prompt: string; label: string };
    className?: string;
};

/**
 * One way in per band: a single button, with sign-in demoted to a line of text
 * where it's offered at all. Two buttons of equal weight repeated down the page
 * made every section read as the same widget pasted again.
 */
export default function JoinCta({
    label,
    locale,
    tone = "forest",
    signIn,
    className,
}: JoinCtaProps) {
    return (
        <div className={cn("flex flex-col items-start gap-[18px]", className)}>
            <ButtonLink href={landingSignUpPath(locale)} tone={tone} size="lg">
                {label}
            </ButtonLink>
            {signIn && (
                <Text size="xs">
                    {signIn.prompt}{" "}
                    <TextLink
                        href={authLink(locale, "signIn", {
                            offerGuest: true,
                        })}
                        weight="semibold"
                    >
                        {signIn.label}
                    </TextLink>
                </Text>
            )}
        </div>
    );
}
