"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { LobbyPlayerStatus } from "@bela/protocol";

import { Button } from "@/components/controls/Button";
import FormError from "@/components/controls/FormError";
import MockLabel from "@/components/pages/table/blocks/MockLabel";
import TableRules from "@/components/pages/table/blocks/TableRules";
import {
    SEAT_COUNT,
    useLobby,
    useLobbyActions,
} from "@/context/lobby-context";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n";
import { localiseLobbyError } from "@/lib/lobby-errors";
import { joinUrl } from "@/lib/routes";
import { pressOnButton } from "@/lib/styles";

type LobbyBandProps = {
    copy: Dictionary["table"];
    locale: Locale;
    signUpHref: string;
    /** Anonymous account — see `TableRules`, the only part that cares. */
    guest: boolean;
};

/** How long the copy button admits to having worked. */
const COPIED_MS = 2000;

/**
 * The one thing to press, and the code that fills the seats around it.
 *
 * Two controls and a line of text. The table is created for you the moment the
 * page loads, so there is nothing here to set up and nothing to decide — the
 * band's whole job is to hand over the link and then get out of the way.
 *
 * The invite code *is* the friends feature. There is no friends list on the
 * backend and no invite entity; a lobby has six characters and anyone holding
 * them can sit down. So the code takes half the band, and the button beside it
 * copies a whole URL rather than the six characters — pasting a link into a
 * chat is the actual gesture, and a bare code leaves the recipient hunting for
 * where to type it.
 *
 * The code and its copy button are welded into one block: the frame carries the
 * shadow and the press physics for the pair, the button inside drops its own.
 * That is what `pressOnButton` is for, and it is why the button no longer casts
 * a second shadow across the frame it sits in.
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

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;

        const id = setTimeout(() => setCopied(false), COPIED_MS);
        return () => clearTimeout(id);
    }, [copied]);

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

    async function copyInvite() {
        if (!lobby) return;

        try {
            await navigator.clipboard.writeText(
                joinUrl(locale, lobby.inviteCode),
            );
            setCopied(true);
        } catch {
            // Clipboard access can be refused outright — an insecure origin, a
            // denied permission. The code is on screen either way, which is why
            // this fails quietly rather than raising an error about a
            // convenience.
        }
    }

    return (
        <section
            aria-label={t.heading}
            className="mx-auto flex w-full max-w-[760px] flex-col gap-3 border-4 border-ink bg-baize-deep p-3 shadow-hard-lg sm:p-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(150px,0.9fr)_minmax(190px,1.2fr)_minmax(160px,auto)] sm:gap-4">
                <TableRules copy={copy} signUpHref={signUpHref} guest={guest} />

                <div
                    className={cn(
                        "flex min-h-16 items-center gap-3 border-[3px] border-ink bg-baize py-2 pr-2 pl-4 shadow-hard-sm",
                        pressOnButton,
                    )}>
                    <span className="min-w-0">
                        <MockLabel className="block truncate text-[9px] tracking-[.12em] text-mint/75">
                            {copy.codeLabel}
                        </MockLabel>
                        {/* Wide tracking, not a monospaced face: this is six
                            characters to read out and retype, and the spacing
                            is what separates them. */}
                        <span className="mt-0.5 block font-display text-[20px] font-extrabold tracking-[.2em] text-cream">
                            {lobby.inviteCode}
                        </span>
                    </span>

                    {/* Icon only. The label would be the longest string in the
                        band and it sits next to the six characters it copies,
                        which say what it is for better than a caption would. */}
                    <Button
                        tone="cream"
                        size="sm"
                        joined
                        onClick={copyInvite}
                        aria-label={copy.copyInvite}
                        title={copied ? t.copied : copy.copyInvite}
                        className="ml-auto flex size-11 shrink-0 items-center justify-center p-0">
                        {copied ? (
                            <Check aria-hidden size={18} strokeWidth={3} />
                        ) : (
                            <Copy aria-hidden size={18} strokeWidth={3} />
                        )}
                    </Button>
                </div>

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
        </section>
    );
}
