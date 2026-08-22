"use client";

import { Button } from "@/components/controls/Button";
import Modal from "@/components/ui/surfaces/Modal";
import Card from "@/components/ui/surfaces/Card";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";

type SessionLockedModalProps = {
    copy: Dictionary["table"]["sessionLockedModal"];
    /** The refusal itself, already localised — see `localiseLobbyError`. */
    body: string;
    closeLabel: string;
    onRetry: () => void;
};

/**
 * What a second window gets instead of a table.
 *
 * A gate rather than a dialog with an X: the lock clears only when the other
 * window lets go of it, so there is nothing to decide here and dismissing
 * would leave an unexplained skeleton pulsing underneath. The way out is doing
 * what the sentence says — leaving the first table — and the screen heals
 * itself once that happens: the poll behind this modal lands a lobby, the
 * error clears, and the gate unmounts without a click.
 *
 * The button exists for the player who has just closed the other window and
 * doesn't want to wait out the poll interval. Pressing it while still locked
 * changes nothing visible — the refusal simply arrives again.
 */
export default function SessionLockedModal({
    copy,
    body,
    closeLabel,
    onRetry,
}: SessionLockedModalProps) {
    return (
        <Modal
            closeLabel={closeLabel}
            dismissible={false}
            className="max-w-[520px]"
        >
            <Card padding="lg" className="gap-4">
                <Heading as="h2" size="card" className="max-w-[20ch]">
                    {copy.heading}
                </Heading>
                <Text size="sm">{body}</Text>
                <Button tone="rust" className="mt-1 self-start" onClick={onRetry}>
                    {copy.action}
                </Button>
            </Card>
        </Modal>
    );
}
