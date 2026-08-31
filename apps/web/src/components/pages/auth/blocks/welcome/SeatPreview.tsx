import UserAvatar from "@/components/layout/UserAvatar";
import Card from "@/components/ui/surfaces/Card";
import Flag from "@/components/ui/graphics/Flag";
import Eyebrow from "@/components/ui/typography/Eyebrow";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";

type SeatPreviewProps = {
    label: string;
    username: string;
    avatarUrl: string | null;
    /** Whatever is in the bio box this second — empty until something is typed. */
    bio: string;
    /** The picked country, or nulls while the field says "rather not say". */
    countryCode: string | null;
    /** The country's name, which is all the flag has to be read out as. */
    countryName: string | null;
    /** Stands in for the bio before there is one. */
    bioEmpty: string;
};

/**
 * The player card, drawn from the form as it is being filled in.
 *
 * The panel beside the form says the line and the flag are what the other
 * three see when you sit down, and this is that sentence shown rather than
 * asserted: the name and the picture are already true, and the two fields
 * being asked for land in it as they are typed. Nothing else about the
 * account appears — no rating, no games played — because at this point there
 * genuinely is nothing else, and the profile banner this mirrors carries the
 * same two facts and no more.
 *
 * The empty bio is the profile's own "no line yet" sentence rather than a
 * blank row: the card keeps its height while the box fills, so the panel does
 * not jump on the first keystroke.
 */
export default function SeatPreview({
    label,
    username,
    avatarUrl,
    bio,
    countryCode,
    countryName,
    bioEmpty,
}: SeatPreviewProps) {
    const line = bio.trim();

    return (
        <div className="flex flex-col gap-3">
            <Eyebrow tone="cream" className="font-normal">
                {label}
            </Eyebrow>

            <Card padding="none" className="overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4">
                    <UserAvatar
                        username={username}
                        avatarUrl={avatarUrl}
                        size="lg"
                        className="border-ink"
                    />
                    <span className="flex min-w-0 items-center gap-2">
                        <Heading as="p" size="label" className="min-w-0 truncate">
                            {username}
                        </Heading>
                        {/* Labelled, unlike the flag on the profile banner:
                            nothing else on this card writes the country out,
                            so unlabelled it is a picture a screen reader
                            would pass over in silence. */}
                        <Flag
                            code={countryCode}
                            label={countryName ?? undefined}
                            size="sm"
                        />
                    </span>
                </div>

                <div className="border-t-4 border-ink px-5 py-4">
                    <Text size="sm" tone={line ? "ink" : "muted"}>
                        {line || bioEmpty}
                    </Text>
                </div>
            </Card>
        </div>
    );
}
