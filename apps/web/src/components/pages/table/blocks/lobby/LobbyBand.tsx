"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";

import { LobbyPlayerStatus } from "@bela/protocol";

import { Button } from "@/components/controls/Button";
import FormError from "@/components/controls/FormError";
import InvitePanel from "@/components/pages/table/blocks/lobby/InvitePanel";
import TableRules from "@/components/pages/table/blocks/lobby/TableRules";
import MockLabel from "@/components/pages/table/blocks/shared/MockLabel";
import { SEAT_COUNT, useLobby, useLobbyActions } from "@/context/lobby-context";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n";
import { localiseLobbyError } from "@/lib/lobby-errors";
import { joinUrl } from "@/lib/routes";
import { focusRing, pressSm } from "@/lib/styles";

type LobbyBandProps = {
    copy: Dictionary["table"];
    locale: Locale;
    signUpHref: string;
    /** Anonymous account — see `TableRules`, the only part that cares. */
    guest: boolean;
};

/**
 * The one thing to press, and the code that fills the seats around it.
 *
 * Two controls and a line of text. The table is created for you the moment the
 * page loads, so there is nothing here to set up and nothing to decide — the
 * band's whole job is to hand over the link and then get out of the way.
 *
 * The link *is* the friends feature. There is no friends list on the backend
 * and no invite entity; a lobby has six characters and anyone holding them can
 * sit down. The band used to print those characters at full size, which made
 * the loudest text on the screen a value with nowhere to go — nothing in the
 * app redeems a typed code, and the block's own press copied a URL rather than
 * the code under the cursor. So the middle cell is a button that opens the
 * panel where the invitation actually happens.
 */
export default function LobbyBand({
    copy,
    locale,
    signUpHref,
    guest,
}: LobbyBandProps) {
    const t = copy.lobby;
    const { lobby, seats, playerCount, isHost, isReady, error } = useLobby();
    const { setReady } = useLobbyActions();

    const [inviteOpen, setInviteOpen] = useState(false);

    if (!lobby) return null;

    const alone = playerCount <= 1;
    const full = playerCount >= SEAT_COUNT;
    const everyoneReady = seats.every(
        (player) => !player || player.status === LobbyPlayerStatus.READY,
    );

    /**
     * When the button starts a game rather than declaring readiness.
     *
     * Alone, there is nobody to be ready *for* — the only thing pressing a
     * button can mean is "deal", and the backend obliges by filling the empty
     * seats with bots. The same is true once everyone who turned up has said
     * they are ready and seats are still open: the table is as full as it is
     * going to get, and waiting on a fourth human who isn't coming is not a
     * state anyone chose. Both cases belong to the host, who is the one who
     * sent the invitations.
     */
    const starts = isHost && !full && (alone || everyoneReady);

    /**
     * How many chairs the bots would take, and the sentence that says so.
     *
     * Pressing the button with seats open deals a hand against bots, and that
     * used to be something you found out afterwards: the button said "Play
     * now", the line underneath went on counting humans, and nothing named the
     * three players about to appear. So when the press starts a game, both
     * halves say what it starts — the label on the control, the count in the
     * note, because "the last seat" and "two open seats" are different enough
     * offers to be worth distinguishing.
     */
    const openSeats = SEAT_COUNT - playerCount;
    const botNote = (
        openSeats === 1 ? t.botFillNote.one : t.botFillNote.other
    ).replace("{count}", String(openSeats));

    return (
        <section
            aria-label={t.heading}
            className="mx-auto flex w-full max-w-[760px] flex-col gap-3 border-4 border-ink bg-baize-deep p-3 shadow-hard-lg sm:p-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(150px,0.9fr)_minmax(190px,1.2fr)_minmax(160px,auto)] sm:gap-4">
                <TableRules copy={copy} signUpHref={signUpHref} guest={guest} />

                {/* Same footprint and the same press physics the code block
                    had, so the band keeps its three-cell rhythm. */}
                <button
                    type="button"
                    onClick={() => setInviteOpen(true)}
                    className={cn(
                        "flex min-h-16 w-full cursor-pointer items-center gap-3 border-[3px] border-ink bg-baize px-4 py-2 text-left shadow-hard-sm",
                        pressSm,
                        focusRing,
                    )}>
                    <span className="grid size-11 shrink-0 place-items-center border-[3px] border-ink bg-cream text-ink">
                        <UserPlus aria-hidden size={18} strokeWidth={3} />
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate font-display text-[18px] font-extrabold tracking-[-.02em] text-cream">
                            {copy.invite.action}
                        </span>
                        <MockLabel className="block truncate text-[12px] font-medium tracking-normal text-mint/75 normal-case">
                            {copy.invite.bandNote}
                        </MockLabel>
                    </span>
                </button>

                <Button
                    tone={!starts && isReady ? "cream" : "rust"}
                    size="lg"
                    onClick={() => setReady(!isReady)}
                    className="min-h-16 w-full py-4 text-center text-[18px] tracking-[-.02em] sm:text-[19px]">
                    {starts
                        ? t.startWithBots
                        : isReady
                          ? t.unreadyAction
                          : t.readyAction}
                </Button>
            </div>

            <p
                aria-live="polite"
                className="m-0 text-center text-[13px] font-semibold text-mint/75 sm:text-[14px]">
                {full
                    ? t.allReadyNote
                    : starts
                      ? botNote
                      : t.waitingNote.replace("{count}", String(playerCount))}
            </p>

            {error && (
                <FormError>
                    {localiseLobbyError(error, copy.lobbyErrors)}
                </FormError>
            )}

            {inviteOpen && (
                <InvitePanel
                    copy={copy}
                    inviteUrl={joinUrl(locale, lobby.inviteCode)}
                    onClose={() => setInviteOpen(false)}
                />
            )}
        </section>
    );
}
