"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/controls/Button";
import Card from "@/components/ui/surfaces/Card";
import Modal from "@/components/ui/surfaces/Modal";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";

type InvitePanelProps = {
    copy: Dictionary["table"];
    /** The URL a friend follows to land in this lobby. */
    inviteUrl: string;
    onClose: () => void;
};

/** How long the copy button admits to having worked. */
const COPIED_MS = 2000;

/**
 * Everything that fills a seat with somebody who isn't here yet, which is one
 * link.
 *
 * The table used to show its six-character code, which was the most prominent
 * text on the band and the one value in the app with nowhere to go: nothing can
 * redeem a typed code, and the block's own press copied a URL rather than the
 * characters under the cursor. So the code is gone and the link took its place.
 *
 * It stood above a preview of a friends list and a pair of visibility choices
 * for a while, both inert — there is no friends entity on the backend, and a
 * lobby has no visibility of any kind (`ChangeLobbyConfigCommand` carries a
 * match type and a target score and nothing else). Drawn early they were meant
 * to settle the panel's shape before the fields existed to back them; what they
 * actually did was bury the one control that works under two that don't. They
 * can come back when there is something behind them.
 *
 * A dialog rather than a dropdown, because `Modal` already owns the top layer,
 * the focus trap, `Esc`, the backdrop and the entrance — and its `onClose`
 * branch exists for exactly this, a panel opened from component state with no
 * history entry to unwind.
 */
export default function InvitePanel({
    copy,
    inviteUrl,
    onClose,
}: InvitePanelProps) {
    const t = copy.invite;
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;

        const id = setTimeout(() => setCopied(false), COPIED_MS);
        return () => clearTimeout(id);
    }, [copied]);

    async function copyInvite() {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
        } catch {
            // Clipboard access can be refused outright — an insecure origin, a
            // denied permission. This fails quietly rather than raising an
            // error about a convenience.
        }
    }

    return (
        <Modal closeLabel={t.close} onClose={onClose} className="max-w-[440px]">
            <Card padding="lg" className="w-full gap-5">
                <Heading as="h2" size="card">
                    {t.heading}
                </Heading>

                <Button
                    tone="rust"
                    size="md"
                    onClick={copyInvite}
                    className="flex w-full items-center justify-center gap-3">
                    {copied ? (
                        <Check aria-hidden size={18} strokeWidth={3} />
                    ) : (
                        <Copy aria-hidden size={18} strokeWidth={3} />
                    )}
                    {copied ? copy.lobby.copied : copy.copyInvite}
                </Button>

                <Text size="xs">{t.linkNote}</Text>
            </Card>
        </Modal>
    );
}
