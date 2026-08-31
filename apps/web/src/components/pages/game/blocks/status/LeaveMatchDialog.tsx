"use client";

import { Button } from "@/components/controls/Button";
import Card from "@/components/ui/surfaces/Card";
import Modal from "@/components/ui/surfaces/Modal";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";

type LeaveMatchDialogProps = {
    copy: Dictionary["game"]["leave"];
    onConfirm: () => void;
    onClose: () => void;
};

/**
 * The question asked before a player takes three other people's game down.
 *
 * Leaving mid-hand is not a navigation, and it is not undoable — the game is
 * dropped, nothing is scored, and the other three are put back at the table
 * whether they were winning or not. That is worth one press to confirm, and it
 * is worth saying in the body rather than leaving to be discovered: a player who
 * expected their seat to be handed to a bot would otherwise find out afterwards.
 *
 * Staying is the plain close control this dialog already carries, for the reason
 * `RankedGate` gives — a second button beside the confirm would give equal
 * weight to doing nothing, when doing nothing is the default and the dialog is
 * only open because the player reached for the other thing.
 */
export default function LeaveMatchDialog({
    copy,
    onConfirm,
    onClose,
}: LeaveMatchDialogProps) {
    return (
        // The one thing on the felt that used to be drawn as a poster: a cream
        // card with a 4px ink frame and a hard shadow, over a table that has
        // neither. It borrowed `Modal` and `Card` at their defaults, which were
        // the marketing page's; asking for the felt is the whole fix.
        <Modal
            closeLabel={copy.close}
            onClose={onClose}
            surface="felt"
            className="max-w-[520px]"
        >
            <Card surface="felt" padding="lg" className="gap-4">
                <Heading
                    surface="felt"
                    as="h2"
                    size="card"
                    className="max-w-[20ch]"
                >
                    {copy.heading}
                </Heading>
                <Text surface="felt" size="sm">
                    {copy.body}
                </Text>
                <Button
                    surface="felt"
                    tone="rust"
                    onClick={onConfirm}
                    className="mt-1 self-start"
                >
                    {copy.confirm}
                </Button>
            </Card>
        </Modal>
    );
}
