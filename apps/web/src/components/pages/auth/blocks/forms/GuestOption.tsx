import { Button } from "@/components/controls/Button";
import LabeledRule from "@/components/ui/surfaces/LabeledRule";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";

type GuestOptionProps = {
    copy: Dictionary["auth"]["common"];
    /**
     * The screen's own submit flag, not a second one. Both ways in run through
     * the same `useAuthSubmit`, so a form in flight greys this out and a guest
     * session in flight greys the form's button — there is only ever one
     * request to wait on.
     */
    pending: boolean;
    onPlay: () => void;
};

/**
 * The way past the credentials: one table, right now, with no account behind
 * it. It sits below whichever form it is under and never above it — the
 * account is the offer, the guest table is the fallback.
 */
export default function GuestOption({
    copy,
    pending,
    onPlay,
}: GuestOptionProps) {
    return (
        <>
            <LabeledRule className="pt-1">{copy.or}</LabeledRule>

            <div className="flex flex-wrap items-center gap-4">
                <Button
                    surface="felt"
                    tone="cream"
                    size="sm"
                    disabled={pending}
                    onClick={onPlay}
                    className="text-[16px] disabled:cursor-wait disabled:opacity-70"
                >
                    {copy.guest}
                </Button>
                <Text surface="felt" size="xs" className="max-w-[30ch]">
                    {copy.guestNote}
                </Text>
            </div>
        </>
    );
}
