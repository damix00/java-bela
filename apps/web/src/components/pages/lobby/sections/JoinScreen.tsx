"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ButtonLink } from "@/components/controls/Button";
import Card from "@/components/ui/surfaces/Card";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import {
    SNAPSHOT_GRACE_MS,
    useLobby,
    useLobbyActions,
} from "@/context/lobby-context";
import { useSocketStatus } from "@/context/socket-context";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { localiseLobbyError } from "@/lib/lobby-errors";
import { homePath } from "@/lib/routes";
import { appGutters } from "@/lib/styles";
import { cn } from "@/lib/cn";

type JoinScreenProps = {
    copy: Dictionary["table"];
    locale: Locale;
    code: string;
};

/**
 * What an invite link does: take the seat, then get out of the way.
 *
 * This screen has no controls and is not meant to be looked at for long. It
 * waits for the socket, joins, and replaces itself with the table the moment
 * the snapshot lands. `replace`, not `push` — the invite URL is a doorway, and
 * leaving it in the history means Back walks the player into a join they have
 * already made.
 *
 * **The visitor almost certainly already has a table.** The front door opens
 * one on arrival, so anyone who looked at the site before clicking a friend's
 * link is holding a lobby of their own, and the backend refuses a second one
 * with "already in lobby". So the first thing this does is leave — silently,
 * because a table nobody was invited to is not something the player will miss,
 * and asking them to confirm abandoning it would be asking about a thing they
 * never chose.
 *
 * Both decisions wait out `SNAPSHOT_GRACE_MS` first. A reconnect delivers the
 * player's existing lobby unprompted and slightly late; acting before it lands
 * means failing to leave a table we are about to be told we are sitting at.
 */
export default function JoinScreen({ copy, locale, code }: JoinScreenProps) {
    const t = copy.join;
    const wanted = code.toUpperCase();

    const status = useSocketStatus();
    const { lobby, error } = useLobby();
    const { joinByCode, leave } = useLobbyActions();
    const router = useRouter();

    // Guards the join against the socket's own reconnects: re-sending it would
    // be answered with "already in lobby" for the table we just took a seat at.
    const settled = useRef(false);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        if (status !== "connected" || settled.current) return;

        const id = setTimeout(() => {
            settled.current = true;

            // Following your own link. Nothing to do but go to the table.
            if (lobby?.inviteCode === wanted) {
                router.replace(homePath(locale));
                return;
            }

            if (lobby) leave();

            setJoining(true);
            joinByCode(wanted);
        }, SNAPSHOT_GRACE_MS);

        return () => clearTimeout(id);
    }, [status, lobby, wanted, locale, router, leave, joinByCode]);

    useEffect(() => {
        // Only once *this* screen's join has produced a table. Redirecting on
        // any lobby at all would bounce straight back on the one the front door
        // opened, before it had been left.
        if (joining && lobby) router.replace(homePath(locale));
    }, [joining, lobby, locale, router]);

    return (
        <main
            className={cn(
                "flex flex-1 flex-col items-center justify-center py-10",
                appGutters,
            )}
        >
            <Card
                padding="lg"
                className="w-full max-w-[440px] gap-4 text-center"
            >
                <Heading as="h1" size="card">
                    {t.heading}
                </Heading>

                {/* Wide tracking rather than a monospaced face — the code is
                    six characters to read, not a snippet of anything. */}
                <p className="m-0 font-display text-[26px] font-extrabold tracking-[.22em] text-ink">
                    {wanted}
                </p>

                <Text size="xs" aria-live="polite">
                    {error
                        ? localiseLobbyError(error, copy.lobbyErrors)
                        : t.joining}
                </Text>

                {error && (
                    <ButtonLink tone="rust" size="md" href={homePath(locale)}>
                        {t.back}
                    </ButtonLink>
                )}
            </Card>
        </main>
    );
}
