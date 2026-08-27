"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import type { AuthActionResult } from "@/actions/auth";
import { applyAuthResponse } from "@/api/token-store";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { homePath } from "@/lib/navigation/routes";

type FormErrors = Dictionary["form"]["errors"];

/**
 * The shared half of every wired auth screen: run a credential action, keep a
 * pending flag while it is in flight, turn a rejection into a localised line,
 * and on success seed the client store and land in the lobby.
 *
 * Sign-in, sign-up and the guest button all do exactly this and differ only in
 * which action they call, so it lives here rather than three times over.
 *
 * `returnTo` is the destination the proxy stashed in `?next=` when it turned
 * this player away from a gated URL, already validated server-side. When there
 * is one, that is where they land instead of the lobby — the point of asking
 * them to sign in was to get them where they were going.
 */
export function useAuthSubmit(
    locale: Locale,
    messages: FormErrors,
    returnTo?: string | null,
) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const submit = useCallback(
        (action: () => Promise<AuthActionResult>, fallback: string) => {
            setError(null);

            startTransition(async () => {
                const result = await action();

                if (!result.ok) {
                    setError(localiseAuthError(result, messages, fallback));
                    return;
                }

                // The store holds the access token for `apiFetch` and, later, the
                // WebSocket. The cookies are already set by the action itself.
                applyAuthResponse(result.auth);

                // `replace`, not `push`: the sign-in screen should not sit in history
                // behind the lobby, or Back walks straight into a form the player has
                // already cleared. `refresh` re-runs the server components so the lobby
                // renders in its signed-in state.
                router.replace(returnTo ?? homePath(locale));
                router.refresh();
            });
        },
        [locale, messages, returnTo, router],
    );

    return { submit, pending, error, setError };
}

/**
 * The API answers with an English sentence and, outside the refresh flow, no
 * machine-readable code — `GlobalExceptionHandler` puts only `message` in the
 * body for an `ExceptionResponse`. So the two register collisions are matched
 * on that sentence, and anything unrecognised falls back to the caller's
 * generic line rather than showing untranslated server text.
 *
 * If the backend ever grows codes for these, match on `result.code` instead and
 * delete the string matching.
 */
function localiseAuthError(
    result: Extract<AuthActionResult, { ok: false }>,
    messages: FormErrors,
    fallback: string,
): string {
    if (result.code === "NETWORK") return messages.networkError;

    const message = result.error.toLowerCase();
    if (message.includes("email already")) return messages.emailTaken;
    if (message.includes("username already")) return messages.usernameTaken;

    return fallback;
}
