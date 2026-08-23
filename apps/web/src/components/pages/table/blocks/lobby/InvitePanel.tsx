"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/controls/Button";
import {
    mockFriends,
    type MockFriend,
} from "@/components/pages/table/blocks/lobby/mock-friends";
import MockLabel from "@/components/pages/table/blocks/shared/MockLabel";
import Card from "@/components/ui/surfaces/Card";
import LabeledRule from "@/components/ui/surfaces/LabeledRule";
import Modal from "@/components/ui/surfaces/Modal";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/cn";

type InvitePanelProps = {
    copy: Dictionary["table"];
    /** The URL a friend follows to land in this lobby. */
    inviteUrl: string;
    onClose: () => void;
};

/** How long the copy button admits to having worked. */
const COPIED_MS = 2000;

/**
 * Everything that fills a seat with somebody who isn't here yet.
 *
 * The table used to show its six-character code, which was the most prominent
 * text on the band and the one value in the app with nowhere to go: nothing can
 * redeem a typed code, and the block's own press copied a URL rather than the
 * characters under the cursor. So the code is gone and the link took its place,
 * with the friends list it will eventually sit above.
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

                <LabeledRule>{t.friends}</LabeledRule>

                {/* One statement, not one per row. Five repetitions of the same
                    label read as noise and bury the names they are attached
                    to. */}
                <Text size="xs" className="-mt-2">
                    {t.friendsNote}
                </Text>

                <ul className="m-0 flex list-none flex-col gap-0 p-0">
                    {mockFriends.map((friend) => (
                        <FriendRow
                            key={friend.id}
                            friend={friend}
                            online={t.online}
                        />
                    ))}
                </ul>

                <LabeledRule>{t.whoCanJoin}</LabeledRule>

                {/* Inert, and not for want of wiring: a lobby has no visibility
                    of any kind on the backend — `ChangeLobbyConfigCommand`
                    carries a match type and a target score and nothing else. The
                    choice is drawn so the panel's shape is settled before the
                    field exists to back it. */}
                <div
                    role="group"
                    aria-label={t.whoCanJoin}
                    className="flex border-4 border-ink">
                    <Choice selected>{t.anyoneWithLink}</Choice>
                    <Choice>{t.inviteOnly}</Choice>
                </div>
                <MockLabel className="-mt-3 text-stone">
                    {copy.profileMenu.soon}
                </MockLabel>
            </Card>
        </Modal>
    );
}

/**
 * One friend, and no invite control on it. There is nothing to press yet, and a
 * row of disabled buttons is a worse promise than a list that never claimed to
 * be one — the note above the list says so once, for all of them.
 */
function FriendRow({
    friend,
    online,
}: {
    friend: MockFriend;
    online: string;
}) {
    return (
        <li className="flex items-center gap-3 border-b-[3px] border-ink/15 py-3 last:border-b-0">
            <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center border-[3px] border-ink bg-sage font-display text-[15px] font-extrabold text-ink uppercase">
                {friend.username.charAt(0)}
            </span>

            <span className="min-w-0 truncate font-display text-[15px] font-extrabold tracking-[-.02em] text-ink">
                {friend.username}
            </span>

            {friend.online && (
                <MockLabel className="ml-auto flex shrink-0 items-center gap-2 text-[10px] text-forest">
                    <span
                        aria-hidden
                        className="size-2 shrink-0 rounded-full bg-forest"
                    />
                    {online}
                </MockLabel>
            )}
        </li>
    );
}

function Choice({
    children,
    selected = false,
}: {
    children: string;
    selected?: boolean;
}) {
    return (
        <span
            aria-disabled="true"
            className={cn(
                "flex-1 px-3 py-3 text-center font-display text-[14px] font-extrabold tracking-[-.02em]",
                "border-r-4 border-ink last:border-r-0",
                selected ? "bg-forest text-cream" : "bg-cream text-stone",
            )}>
            {children}
        </span>
    );
}
