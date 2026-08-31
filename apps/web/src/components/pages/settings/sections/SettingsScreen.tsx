"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { logout } from "@/actions/auth";
import { signOutEverywhere } from "@/actions/profile";
import { clearAuth } from "@/api/token-store";
import type { User } from "@/api/types/user";
import { isGuest } from "@/api/types/user";
import { Button, ButtonLink } from "@/components/controls/Button";
import FormError from "@/components/controls/FormError";
import LanguageSwitcher from "@/components/controls/LanguageSwitcher";
import AccountPage from "@/components/layout/AccountPage";
import SettingsRow from "@/components/pages/settings/blocks/SettingsRow";
import DividedPanel from "@/components/ui/surfaces/DividedPanel";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";
import { forgetLobby } from "@/lib/game/last-lobby";
import type { Locale } from "@/lib/i18n/config";
import { authPath, homePath, profilePath } from "@/lib/navigation/routes";

type SettingsScreenProps = {
    copy: Dictionary["settings"];
    locale: Locale;
    /** Read from the session on the server — see `ProfileScreen`'s note. */
    user: User;
};

/**
 * Everything about the account that isn't the face other players see.
 *
 * Rows, not a form: each one is its own decision and takes effect the moment it
 * is made, so there is nothing for a save button to gather. The two rows with
 * no endpoint behind them are still drawn — see `SettingsRow`.
 */
export default function SettingsScreen({
    copy,
    locale,
    user,
}: SettingsScreenProps) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const guest = isGuest(user);

    function endThisSession() {
        startTransition(async () => {
            await logout();
            clearAuth();
            // The remembered table belongs to the account that was sitting at
            // it. Left behind, the next person to sign in on this tab would be
            // rejoined to a stranger's lobby — see `last-lobby`.
            forgetLobby();
            router.replace(homePath(locale));
            router.refresh();
        });
    }

    function endEverySession() {
        startTransition(async () => {
            setError(null);
            const result = await signOutEverywhere();

            if (!result.ok) {
                setError(copy.signOutAll.failed);
                setConfirming(false);
                return;
            }

            // The cookies are already gone server-side; this drops the access
            // token the client still holds so nothing keeps sending it.
            clearAuth();
            forgetLobby();
            router.replace(homePath(locale));
            router.refresh();
        });
    }

    return (
        <AccountPage
            heading={copy.heading}
            intro={copy.intro}
            action={
                // A guest has no profile to cross-link to, and offering the
                // link anyway would send them to a page that only bounces.
                guest ? null : (
                    <ButtonLink
                        surface="felt"
                        href={profilePath(locale)}
                        tone="cream"
                        size="sm"
                        className="shrink-0"
                    >
                        {copy.profileLink}
                    </ButtonLink>
                )
            }
        >
            <DividedPanel surface="felt">
                <SettingsRow
                    heading={copy.language.heading}
                    body={copy.language.body}
                    action={
                        <LanguageSwitcher
                            surface="felt"
                            current={locale}
                            label={copy.language.label}
                            className="shrink-0"
                        />
                    }
                />

                <SettingsRow
                    heading={copy.account.heading}
                    body={guest ? copy.account.guestBody : copy.account.body}
                    action={
                        guest ? (
                            <ButtonLink
                                surface="felt"
                                href={authPath(locale, "signUp")}
                                tone="rust"
                                size="sm"
                                className="shrink-0"
                            >
                                {copy.account.guestAction}
                            </ButtonLink>
                        ) : (
                            <Text
                                surface="felt"
                                size="sm"
                                tone="mintSoft"
                                className="max-w-full min-w-0 truncate font-medium"
                            >
                                {user.email}
                            </Text>
                        )
                    }
                />

                {/* On a phone this is the only sign-out there is: the avatar menu
                    that carries one is hidden below `sm`, and the bottom bar's
                    account tile leads here. */}
                <SettingsRow
                    heading={copy.signOut.heading}
                    body={copy.signOut.body}
                    action={
                        <Button
                            surface="felt"
                            tone="mint"
                            size="sm"
                            onClick={endThisSession}
                            disabled={pending}
                            className="shrink-0"
                        >
                            {copy.signOut.action}
                        </Button>
                    }
                />

                {/* Guests have exactly one session — this one — so "everywhere"
                    is a more alarming way of spelling the sign-out already in
                    the avatar menu. The row is theirs to gain with an account. */}
                {!guest && (
                    <SettingsRow
                        heading={copy.signOutAll.heading}
                        body={copy.signOutAll.body}
                        action={
                            confirming ? null : (
                                <Button
                                    surface="felt"
                                    tone="mint"
                                    size="sm"
                                    onClick={() => setConfirming(true)}
                                    className="shrink-0"
                                >
                                    {copy.signOutAll.action}
                                </Button>
                            )
                        }
                    >
                        {error && <FormError surface="felt">{error}</FormError>}
                        {confirming && (
                            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-forest p-4">
                                <Text
                                    surface="felt"
                                    size="sm"
                                    tone="cream"
                                    className="mr-auto font-medium"
                                >
                                    {copy.signOutAll.confirm}
                                </Text>
                                <Button
                                    surface="felt"
                                    tone="cream"
                                    size="sm"
                                    onClick={() => setConfirming(false)}
                                    disabled={pending}
                                >
                                    {copy.signOutAll.cancel}
                                </Button>
                                <Button
                                    surface="felt"
                                    tone="rust"
                                    size="sm"
                                    onClick={endEverySession}
                                    disabled={pending}
                                >
                                    {copy.signOutAll.confirmAction}
                                </Button>
                            </div>
                        )}
                    </SettingsRow>
                )}

                {!guest && (
                    <SettingsRow
                        heading={copy.changePassword.heading}
                        body={copy.changePassword.body}
                        soon={copy.soon}
                    />
                )}

                <SettingsRow
                    heading={copy.deleteAccount.heading}
                    body={copy.deleteAccount.body}
                    soon={copy.soon}
                />
            </DividedPanel>
        </AccountPage>
    );
}
