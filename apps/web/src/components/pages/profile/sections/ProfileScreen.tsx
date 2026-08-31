"use client";

// Opted out of the React Compiler, for `react-hook-form`.
//
// `register("bio")` is not a pure call — it is how the form re-attaches a field
// on every render — but it reads like one, so the compiler caches its result
// against `register`, which never changes. It therefore runs exactly once, on
// the first render, and never again.
//
// Nothing goes wrong until something calls `reset()`. This is the one form in
// the app that does (a save comes back with the server's trimmed, uppercased
// version and the boxes have to show that), and after it the field entries the
// textarea's cached handler was bound to are gone. Typing then updates the box
// and nothing else: the character counter freezes, and the next save posts the
// bio from before the last one — the box says one thing and the form holds
// another.
//
// The auth screens are safe today only because none of them reset. If one ever
// does, it needs this line too.
"use no memo";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { updateProfile } from "@/actions/profile";
import { refreshAccessToken } from "@/api/token-store";
import { SESSION_EXPIRED } from "@/lib/profile/result";
import type { User } from "@/api/types/user";
import { ButtonLink, Button } from "@/components/controls/Button";
import CountrySelect from "@/components/controls/CountrySelect";
import Field, { invalidProps } from "@/components/controls/Field";
import FormError from "@/components/controls/FormError";
import Input from "@/components/controls/Input";
import AccountPage from "@/components/layout/AccountPage";
import ProfileFacts from "@/components/pages/profile/blocks/ProfileFacts";
import ProfileHero from "@/components/pages/profile/blocks/ProfileHero";
import Eyebrow from "@/components/ui/typography/Eyebrow";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import { useAuth } from "@/context/auth-context";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/ui/cn";
import type { CountryOption } from "@/lib/i18n/countries";
import type { Locale } from "@/lib/i18n/config";
import { settingsPath } from "@/lib/navigation/routes";
import { focusRing, inputBox } from "@/lib/ui/styles";
import {
    BIO_MAX,
    profileSchema,
    type FormErrors,
    type ProfileValues,
} from "@/lib/validation/schemas";

type ProfileScreenProps = {
    copy: Dictionary["profile"];
    errors: FormErrors;
    locale: Locale;
    /**
     * The signed-in player, read from the session on the server. Handed down
     * rather than pulled from `useAuth` for the reason `TableScreen` gives: the
     * token store is seeded in an effect, so context is a pass behind on load
     * and the form would mount with empty boxes.
     *
     * Never a guest — the route sends those to sign-up, because the API refuses
     * to rename an anonymous account and a form that cannot be saved is worse
     * than not being offered one.
     */
    user: User;
    /** Built on the server — see `countryOptions`. */
    countries: CountryOption[];
};

/** The saved/failed line under the submit, which is not a field error. */
type Status = { tone: "ok" | "error"; message: string } | null;

/**
 * The profile, and the one form in the app that edits an existing record
 * rather than creating one.
 *
 * The save goes through a server action rather than `apiFetch`, even though the
 * endpoint is an ordinary authenticated one, because the session cookie has to
 * be rewritten in the same breath: every server render reads the player's name
 * out of that cookie, and a save the cookie didn't hear about would leave the
 * top bar and the seat at the table showing the old one.
 *
 * That trade costs the automatic 401 retry `apiFetch` performs internally, so
 * this does it by hand — refreshing is the client's job, since that is where
 * the single-flight lives.
 */
export default function ProfileScreen({
    copy,
    errors,
    locale,
    user,
    countries,
}: ProfileScreenProps) {
    const router = useRouter();
    const { setUser } = useAuth();
    const [pending, startTransition] = useTransition();
    const [status, setStatus] = useState<Status>(null);

    const schema = useMemo(() => profileSchema(errors), [errors]);

    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors: fieldErrors },
    } = useForm<ProfileValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            username: user.username,
            bio: user.bio ?? "",
            countryCode: user.countryCode ?? "",
        },
    });

    // `useWatch` rather than `watch`, as the auth screens do: the subscription
    // re-renders this component alone, and it is what the React Compiler can
    // reason about.
    const bio = useWatch({ control, name: "bio" });
    const remaining = BIO_MAX - (bio?.length ?? 0);

    function onSubmit(values: ProfileValues) {
        startTransition(async () => {
            setStatus(null);

            let result = await updateProfile(values);

            // An access token that expired while the form sat open is the
            // ordinary case, not a signed-out player. One refresh, one retry.
            if (!result.ok && result.code === SESSION_EXPIRED) {
                const token = await refreshAccessToken();
                if (token) {
                    result = await updateProfile(values);
                }
            }

            if (!result.ok) {
                setStatus({
                    tone: "error",
                    message: localiseError(result, copy, errors),
                });
                return;
            }

            setUser(result.user);
            // The boxes now hold what the server stored — trimmed, uppercased —
            // rather than what was typed at them.
            reset({
                username: result.user.username,
                bio: result.user.bio ?? "",
                countryCode: result.user.countryCode ?? "",
            });
            setStatus({ tone: "ok", message: copy.saved });
            // What re-renders the top bar with the new name.
            router.refresh();
        });
    }

    return (
        <AccountPage>
            <ProfileHero
                username={user.username}
                avatarUrl={user.avatarUrl}
                bio={user.bio}
                countryCode={user.countryCode}
                createdAt={user.createdAt}
                copy={copy}
                locale={locale}
                action={
                    <ButtonLink
                        href={settingsPath(locale)}
                        tone="cream"
                        size="sm"
                        className="shrink-0"
                    >
                        {copy.settingsLink}
                    </ButtonLink>
                }
            />

            <ProfileFacts
                email={user.email}
                countryCode={user.countryCode}
                createdAt={user.createdAt}
                copy={copy}
                locale={locale}
            />

            <form
                noValidate
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-6 border-4 border-ink bg-cream p-5 shadow-hard sm:p-7"
            >
                <Heading as="h2" size="label">
                    {copy.editHeading}
                </Heading>

                {status?.tone === "error" && (
                    <FormError>{status.message}</FormError>
                )}

                <Field
                    htmlFor="username"
                    label={copy.usernameLabel}
                    hint={copy.usernameHint}
                    error={fieldErrors.username?.message}
                >
                    <Input
                        id="username"
                        autoComplete="nickname"
                        {...invalidProps("username", fieldErrors.username)}
                        {...register("username")}
                    />
                </Field>

                <Field
                    htmlFor="bio"
                    label={copy.bioLabel}
                    action={
                        <Eyebrow aria-live="polite">
                            {remaining} {copy.bioRemaining}
                        </Eyebrow>
                    }
                    hint={copy.bioHint}
                    error={fieldErrors.bio?.message}
                >
                    <textarea
                        id="bio"
                        rows={3}
                        placeholder={copy.bioPlaceholder}
                        className={cn(focusRing, inputBox, "resize-y bg-white")}
                        {...invalidProps("bio", fieldErrors.bio)}
                        {...register("bio")}
                    />
                </Field>

                <Field htmlFor="countryCode" label={copy.countryLabel}>
                    {/* The one field that isn't an `<input>`, so the one that
                        needs `Controller` — `register` has no element to attach
                        to. */}
                    <Controller
                        control={control}
                        name="countryCode"
                        render={({ field }) => (
                            <CountrySelect
                                id="countryCode"
                                value={field.value}
                                onChange={field.onChange}
                                countries={countries}
                                noneLabel={copy.countryNone}
                                searchLabel={copy.countrySearch}
                                emptyLabel={copy.countryNoMatch}
                            />
                        )}
                    />
                </Field>

                <div className="flex flex-wrap items-center gap-4">
                    <Button
                        type="submit"
                        tone="rust"
                        size="lg"
                        disabled={pending}
                    >
                        {copy.submit}
                    </Button>
                    {status?.tone === "ok" && (
                        <Text size="sm" role="status" className="text-forest">
                            {status.message}
                        </Text>
                    )}
                </div>
            </form>
        </AccountPage>
    );
}

/**
 * The backend's message where there is a useful one, localised copy otherwise.
 *
 * "Username already exists" is the only sentence this endpoint returns that a
 * player can act on, and it is the same sentence `register` returns — so it is
 * mapped through the same dictionary key rather than a second one that would
 * have to be kept in step with it.
 */
function localiseError(
    result: { error: string; code?: string },
    copy: Dictionary["profile"],
    errors: FormErrors,
) {
    if (result.code === "NETWORK") return errors.networkError;
    if (result.code === SESSION_EXPIRED) return copy.sessionExpired;
    if (result.error.toLowerCase().includes("username already")) {
        return errors.usernameTaken;
    }

    return copy.failed;
}
