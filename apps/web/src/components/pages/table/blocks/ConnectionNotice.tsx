"use client";

import { ButtonLink } from "@/components/controls/Button";
import { useSocket } from "@/context/socket-context";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { authPath } from "@/lib/routes";

/**
 * What the table says when it has lost the line to the backend.
 *
 * A belote table is live state that only exists over the socket — there is no
 * REST endpoint to fall back on — so a disconnected screen is showing a
 * position that may already be wrong. Saying so is cheaper than letting someone
 * press Ready into a void.
 *
 * Two states, and only two. `disconnected` is temporary and the client is
 * already backing off towards a retry, so it is a line rather than a barrier.
 * `auth-failed` is terminal: the backend closed the handshake with 4401 or the
 * session ended locally, and no amount of waiting fixes either — that one gets
 * the way out.
 *
 * `connecting` says nothing at all. It is the first half-second of every page
 * load, and a banner that appears and vanishes on arrival is worse than
 * silence.
 *
 * It floats rather than sitting in the column. A backoff retry can drop and
 * restore this line several times in a minute, and in the flow each of those
 * shoved the whole table down and pulled it back up — the seats jumping is a
 * louder signal than the sentence causing it. Fixed to the bottom of the
 * viewport it costs no layout at all, clear of the mobile tab bar it would
 * otherwise land on.
 *
 * The live region is the wrapper, not the message, so it is in the document
 * before there is anything to say. A region that arrives already populated is
 * frequently announced by nobody.
 */
export default function ConnectionNotice({
    copy,
    locale,
}: {
    copy: Dictionary["table"]["connection"];
    locale: Locale;
}) {
    const { status } = useSocket();

    const expired = status === "auth-failed";
    const settled = status === "connected" || status === "connecting";

    return (
        <div
            role="status"
            aria-live="polite"
            // Nothing but the notice itself may catch a press: the wrapper spans
            // the width of the screen and sits above the seats along that whole
            // strip.
            className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+0.75rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-4 sm:bottom-6"
        >
            {!settled && (
                <p className="pointer-events-auto m-0 flex flex-wrap items-center justify-center gap-3 border-4 border-ink bg-ink px-4 py-3 text-center text-[13px] font-semibold text-cream shadow-hard-sm">
                    {expired ? copy.expired : copy.reconnecting}
                    {expired && (
                        <ButtonLink
                            tone="cream"
                            size="sm"
                            href={authPath(locale, "signIn")}
                        >
                            {copy.signIn}
                        </ButtonLink>
                    )}
                </p>
            )}
        </div>
    );
}
