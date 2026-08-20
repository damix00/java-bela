"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { login, loginAnonymous } from "@/actions/auth";
import { Button } from "@/components/controls/Button";
import Field, { invalidProps } from "@/components/controls/Field";
import FormError from "@/components/controls/FormError";
import Input from "@/components/controls/Input";
import PasswordInput from "@/components/controls/PasswordInput";
import AuthSplit from "@/components/pages/auth/blocks/AuthSplit";
import GuestOption from "@/components/pages/auth/blocks/GuestOption";
import { useAuthSubmit } from "@/components/pages/auth/useAuthSubmit";
import Logo from "@/components/ui/brand/Logo";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import TextLink from "@/components/ui/typography/TextLink";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { authLink, authPath } from "@/lib/routes";
import { signInSchema, type SignInValues } from "@/lib/validation";

type SignInScreenProps = {
    copy: Dictionary["auth"]["signIn"];
    common: Dictionary["auth"]["common"];
    errors: Dictionary["form"]["errors"];
    locale: Locale;
    /**
     * True when this is the standalone page rather than the intercepted modal.
     * Only the cross-link to sign-up cares: see `TextLink`'s `hardNavigation`.
     */
    standalone?: boolean;
    /**
     * Where to land once there is a session, when the player was sent here from
     * a gated URL. Validated server-side by `safeReturnPath` — never trusted
     * raw from the query string.
     */
    returnTo?: string | null;
    /**
     * Whether to offer guest play. False only for a visitor who is already
     * signed in as a guest — the button would hand them a second throwaway
     * account, which is the one thing they came here to stop having.
     */
    showGuest?: boolean;
    /**
     * Whether the cross-link to sign-up should carry the guest offer with it.
     * True when this screen was itself reached from a landing-page CTA, so
     * bouncing between the two forms never loses the way past them.
     */
    offerGuestOnSignUp?: boolean;
};

/**
 * Returning player, and the home of guest play: this is the screen where "I
 * don't want to type credentials right now" is the question actually being
 * asked, so the table-without-an-account sits under the form that asks it.
 */
export default function SignInScreen({
    copy,
    common,
    errors: messages,
    locale,
    standalone = false,
    returnTo = null,
    showGuest = true,
    offerGuestOnSignUp = false,
}: SignInScreenProps) {
    const schema = useMemo(() => signInSchema(messages), [messages]);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignInValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: "", password: "" },
    });

    const { submit, pending, error } = useAuthSubmit(
        locale,
        messages,
        returnTo,
    );

    return (
        <AuthSplit
            aside={
                <>
                    <Logo withMark tone="cream" />
                    <div className="flex flex-col gap-[26px]">
                        <Heading
                            size="cardHero"
                            tone="cream"
                            className="max-w-[16ch]"
                        >
                            {copy.promo}
                        </Heading>
                    </div>
                </>
            }
        >
            <div className="flex flex-col gap-2">
                <Heading as="h1" size="cardHero">
                    {copy.heading}
                </Heading>
                <Text size="md">
                    {copy.noAccount}{" "}
                    <TextLink
                        replace
                        href={authLink(locale, "signUp", {
                            returnTo,
                            offerGuest: offerGuestOnSignUp,
                        })}
                        hardNavigation={standalone}
                        className="text-[17px] font-bold"
                    >
                        {copy.createOne}
                    </TextLink>
                    .
                </Text>
            </div>

            {/* `contents` so the form disappears into the panel's own column: the
          card owns the spacing, the form owns the submit. `noValidate` hands
          the browser's own bubbles over to the schema, which speaks the
          player's language and points at the field in the page. */}
            <form
                noValidate
                onSubmit={handleSubmit((values) =>
                    submit(
                        () => login(values.email, values.password),
                        messages.signInFailed,
                    ),
                )}
                className="contents"
            >
                {error && <FormError>{error}</FormError>}

                <Field
                    htmlFor="email"
                    label={common.email}
                    error={errors.email?.message}
                >
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        {...invalidProps("email", errors.email)}
                        {...register("email")}
                    />
                </Field>

                <Field
                    htmlFor="password"
                    label={common.password}
                    error={errors.password?.message}
                    action={
                        <TextLink
                            href={authPath(locale, "forgotPassword")}
                            weight="semibold"
                            className="text-[14px]"
                        >
                            {copy.forgot}
                        </TextLink>
                    }
                >
                    <PasswordInput
                        id="password"
                        showLabel={common.show}
                        hideLabel={common.hide}
                        {...invalidProps("password", errors.password)}
                        {...register("password")}
                    />
                </Field>

                {/* The "keep me signed in" tickbox that used to sit here is gone: the
            backend issues a 30-day refresh token either way, so the box could
            only ever promise something already unconditionally true. */}

                <Button
                    type="submit"
                    tone="forest"
                    size="lg"
                    disabled={pending}
                    className="py-[17px] text-[18px] disabled:cursor-wait disabled:opacity-70"
                >
                    {copy.submit}
                </Button>
            </form>

            {showGuest && (
                <GuestOption
                    copy={common}
                    pending={pending}
                    onPlay={() => submit(loginAnonymous, messages.signInFailed)}
                />
            )}
        </AuthSplit>
    );
}
