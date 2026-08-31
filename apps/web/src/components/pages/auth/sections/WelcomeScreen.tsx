"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { dismissWelcome, updateProfile } from "@/actions/profile";
import { refreshAccessToken } from "@/api/token-store";
import { Button } from "@/components/controls/Button";
import CountrySelect from "@/components/controls/CountrySelect";
import Field, { invalidProps } from "@/components/controls/Field";
import FormError from "@/components/controls/FormError";
import AuthSplit from "@/components/pages/auth/blocks/layout/AuthSplit";
import PlacementCard from "@/components/pages/auth/blocks/rating/PlacementCard";
import Eyebrow from "@/components/ui/typography/Eyebrow";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import { useAuth } from "@/context/auth-context";
import type { Dictionary } from "@/dictionaries";
import { SESSION_EXPIRED } from "@/lib/profile/result";
import type { CountryOption } from "@/lib/i18n/countries";
import type { Locale } from "@/lib/i18n/config";
import { homePath } from "@/lib/navigation/routes";
import { cn } from "@/lib/ui/cn";
import { focusRing, inputBox } from "@/lib/ui/styles";
import {
    BIO_MAX,
    welcomeProfileSchema,
    type FormErrors,
    type WelcomeProfileValues,
} from "@/lib/validation/schemas";

/** The five games a new account plays before it has a rating. */
const PLACEMENT_TOTAL = 5;

type WelcomeScreenProps = {
    copy: Dictionary["auth"]["welcome"];
    /**
     * The profile page's copy, borrowed wholesale for the two fields.
     *
     * They are the same two fields under the same rules, and the labels, the
     * hint, the placeholder, the counter suffix and all four `CountrySelect`
     * strings already exist in both languages. A second set under
     * `auth.welcome` would be ten strings to keep in step with these, and they
     * would drift.
     */
    profile: Dictionary["profile"];
    errors: FormErrors;
    locale: Locale;
    /**
     * Read from the session on the server rather than from `useAuth`, for the
     * reason `ProfileScreen` gives: the token store is seeded in an effect, so
     * context is a pass behind on load and the heading would greet nobody.
     */
    username: string;
    /** Built on the server — see `countryOptions`. */
    countries: CountryOption[];
};

/**
 * The landing beat after sign-up, with something to do on it.
 *
 * The account exists by the time anyone reads this, so nothing here is a gate:
 * both buttons lead to the lobby, and the only difference between them is
 * whether a line and a flag go with the name on the way. That is why the skip
 * is a button of equal weight and not a link hidden under the fold — an
 * optional field asked at the wrong moment is worse than not asked.
 *
 * Either way out marks the step answered for this browser, so it is offered
 * exactly once. The profile page is where it lives afterwards.
 *
 * Unlike `ProfileScreen` this needs no `"use no memo"`: that directive is there
 * because the profile form calls `reset()`, and this one navigates away on
 * success instead of re-seeding its boxes.
 */
export default function WelcomeScreen({
    copy,
    profile,
    errors,
    locale,
    username,
    countries,
}: WelcomeScreenProps) {
    const router = useRouter();
    const { setUser } = useAuth();
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const schema = useMemo(() => welcomeProfileSchema(errors), [errors]);

    const {
        control,
        register,
        handleSubmit,
        formState: { errors: fieldErrors },
    } = useForm<WelcomeProfileValues>({
        resolver: zodResolver(schema),
        defaultValues: { bio: "", countryCode: "" },
    });

    const bio = useWatch({ control, name: "bio" });
    const remaining = BIO_MAX - (bio?.length ?? 0);

    /**
     * Both ways out. `replace`, not `push`: a step that is over should not sit
     * in history behind the lobby, and `refresh` re-runs the server components
     * so the top bar renders with whatever was just saved.
     */
    async function leave() {
        await dismissWelcome();
        router.replace(homePath(locale));
        router.refresh();
    }

    function onSubmit(values: WelcomeProfileValues) {
        startTransition(async () => {
            setError(null);

            // Nothing typed is a skip that took the long way round — there is no
            // sense posting two empty strings over an already empty profile.
            if (!values.bio && !values.countryCode) {
                await leave();
                return;
            }

            let result = await updateProfile(values);

            // The token can expire while the form sits open; that is an ordinary
            // stale tab, not a signed-out player. One refresh, one retry — the
            // same hand-rolled retry `ProfileScreen` does, because a server
            // action cannot use the one inside `apiFetch`.
            if (!result.ok && result.code === SESSION_EXPIRED) {
                const token = await refreshAccessToken();
                if (token) {
                    result = await updateProfile(values);
                }
            }

            if (!result.ok) {
                setError(localiseError(result, profile, errors));
                return;
            }

            setUser(result.user);
            await leave();
        });
    }

    return (
        <AuthSplit
            asideSide="right"
            asideTone="forest"
            asideAlign="center"
            stackOrder="asideLast"
            shadow="rust"
            columns="lg:grid-cols-[55%_45%]"
            aside={
                <>
                    <Heading
                        as="h1"
                        size="cardHero"
                        tone="cream"
                        className="max-w-[18ch]"
                    >
                        {copy.heading} {username}
                    </Heading>
                    <Text size="md" tone="mint" className="max-w-[36ch]">
                        {copy.body}
                    </Text>
                    {/* Honest for an account minutes old, and the same card the
                        rating screens use — nothing is being previewed here that
                        isn't about to be true. */}
                    <PlacementCard
                        label={copy.placement}
                        played={0}
                        total={PLACEMENT_TOTAL}
                        layout="inline"
                    />
                </>
            }
        >
            <Heading as="h2" size="label">
                {copy.formHeading}
            </Heading>

            <form
                noValidate
                onSubmit={handleSubmit(onSubmit)}
                className="contents"
            >
                {error && <FormError>{error}</FormError>}

                <Field
                    htmlFor="bio"
                    label={profile.bioLabel}
                    action={
                        <Eyebrow aria-live="polite">
                            {remaining} {profile.bioRemaining}
                        </Eyebrow>
                    }
                    hint={profile.bioHint}
                    error={fieldErrors.bio?.message}
                >
                    <textarea
                        id="bio"
                        rows={3}
                        placeholder={profile.bioPlaceholder}
                        className={cn(focusRing, inputBox, "resize-y bg-white")}
                        {...invalidProps("bio", fieldErrors.bio)}
                        {...register("bio")}
                    />
                </Field>

                <Field htmlFor="countryCode" label={profile.countryLabel}>
                    {/* The one field that isn't an `<input>`, so the one that
                        needs `Controller`. */}
                    <Controller
                        control={control}
                        name="countryCode"
                        render={({ field }) => (
                            <CountrySelect
                                id="countryCode"
                                value={field.value}
                                onChange={field.onChange}
                                countries={countries}
                                noneLabel={profile.countryNone}
                                searchLabel={profile.countrySearch}
                                emptyLabel={profile.countryNoMatch}
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
                        className="disabled:cursor-wait disabled:opacity-70"
                    >
                        {copy.submit}
                    </Button>
                    {/* `type="button"`, or the browser submits the form with it —
                        the point of this one is that nothing is sent. Disabled
                        alongside the save so the two cannot race each other to
                        the lobby. */}
                    <Button
                        type="button"
                        tone="cream"
                        size="lg"
                        disabled={pending}
                        onClick={() => startTransition(leave)}
                    >
                        {copy.skip}
                    </Button>
                </div>
            </form>
        </AuthSplit>
    );
}

/**
 * The three things that can go wrong here, in the player's language.
 *
 * The profile page's own copy again: the sentences are about the same failed
 * save. There is no username on this form, so the collision case it handles has
 * nothing to match here.
 */
function localiseError(
    result: { error: string; code?: string },
    profile: Dictionary["profile"],
    errors: FormErrors,
) {
    if (result.code === "NETWORK") return errors.networkError;
    if (result.code === SESSION_EXPIRED) return profile.sessionExpired;

    return profile.failed;
}
