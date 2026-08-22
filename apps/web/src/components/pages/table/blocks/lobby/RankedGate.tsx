"use client";

import { ButtonLink } from "@/components/controls/Button";
import Modal from "@/components/ui/surfaces/Modal";
import Card from "@/components/ui/surfaces/Card";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";

type RankedGateProps = {
    copy: Dictionary["table"]["guestRanked"];
    closeLabel: string;
    /** Sign-up, which is the only way past this. */
    href: string;
    onClose: () => void;
};

/**
 * What a guest gets when they pick ranked.
 *
 * The alternative was leaving ranked selectable and refusing at the play
 * button, which is worse in both directions: the mode looks available right up
 * until it isn't, and the refusal arrives after the player has committed to
 * starting a game. Answering at the moment of the click costs one dismissal and
 * explains itself.
 *
 * It does not select ranked on the way in or out. The dialog is a refusal, and
 * a refusal that quietly changes the selection behind it would leave the player
 * looking at a mode they cannot start once they dismiss it.
 */
export default function RankedGate({
    copy,
    closeLabel,
    href,
    onClose,
}: RankedGateProps) {
    return (
        <Modal
            closeLabel={closeLabel}
            onClose={onClose}
            className="max-w-[520px]"
        >
            <Card padding="lg" className="gap-4">
                <Heading as="h2" size="card" className="max-w-[20ch]">
                    {copy.heading}
                </Heading>
                <Text size="sm">{copy.body}</Text>
                {/* One way forward and one way out, and the way out is the plain
                    close control this dialog already carries — a second dismiss
                    button beside the CTA would give equal weight to doing nothing. */}
                <ButtonLink href={href} tone="rust" className="mt-1 self-start">
                    {copy.action}
                </ButtonLink>
            </Card>
        </Modal>
    );
}
