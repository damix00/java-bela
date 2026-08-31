"use client";

import Card from "@/components/ui/surfaces/Card";
import Modal from "@/components/ui/surfaces/Modal";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import { useSocketStatus } from "@/context/socket-context";
import type { Dictionary } from "@/dictionaries";

/**
 * What a window gets when the player picks the game up somewhere else.
 *
 * The newest connection takes the seat, so this window's table has stopped
 * being live — it is a photograph of a hand that is still being played next
 * door. Saying so is the whole job. There is no button because there is no
 * decision: offering "resume here" would hand the seat back and start the two
 * windows passing it between them, and a redirect would move someone who is
 * not even looking at this screen.
 *
 * A gate rather than a dismissible dialog, and mounted on the app layout rather
 * than the table, because the same thing is true of a game in progress — that
 * screen has no `ConnectionNotice` of its own and would otherwise sit there
 * accepting cards it can no longer play.
 */
export default function SessionSupersededModal({
    copy,
}: {
    copy: Dictionary["table"]["sessionSuperseded"];
}) {
    const status = useSocketStatus();

    if (status !== "superseded") return null;

    return (
        <Modal
            surface="felt"
            closeLabel={copy.close}
            dismissible={false}
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
            </Card>
        </Modal>
    );
}
