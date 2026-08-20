"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

import { loginAnonymous, register as registerAccount } from "@/actions/auth";
import { Button } from "@/components/controls/Button";
import Checkbox from "@/components/controls/Checkbox";
import Field, { errorId, invalidProps } from "@/components/controls/Field";
import FieldError from "@/components/controls/FieldError";
import FormError from "@/components/controls/FormError";
import Input from "@/components/controls/Input";
import PasswordInput from "@/components/controls/PasswordInput";
import AuthSplit from "@/components/pages/auth/blocks/AuthSplit";
import PerkList from "@/components/pages/auth/blocks/PerkList";
import RuleLine from "@/components/pages/auth/blocks/RuleLine";
import { useAuthSubmit } from "@/components/pages/auth/useAuthSubmit";
import LabeledRule from "@/components/ui/surfaces/LabeledRule";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import TextLink from "@/components/ui/typography/TextLink";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { authPath, legalPath, withReturn } from "@/lib/routes";
import {
    PASSWORD_MIN,
    signUpSchema,
    type SignUpValues,
} from "@/lib/validation";

type SignUpScreenProps = {
    copy: Dictionary["auth"]["signUp"];
    common: Dictionary["auth"]["common"];
    form: Dictionary["form"];
    locale: Locale;
    /**
     * True when this is the standalone page rather than the intercepted modal.
     * Only the cross-link to sign-in cares: see `TextLink`'s `hardNavigation`.
     */
    standalone?: boolean;
    /**
     * Whether to offer guest play. False for a visitor who is already signed in
     * as a guest — the button would hand them a second throwaway account, which
     * is the one thing they came here to stop having.
     */
    showGuest?: boolean;
    /** See `SignInScreen` — the destination the proxy stashed in `?next=`. */
    returnTo?: string | null;
};

/**
 * One password field, one live requirement, no confirm field — a second box to
 * retype into catches typos that the reveal toggle catches better.
 *
 * Guest play sits below the fold of the form and never above it — the account
 * is the offer, the guest table is the fallback. For someone who took that
 * fallback already it is not offered at all.
 */
export default function SignUpScreen({
    copy,
    common,
    form,
    locale,
    standalone = false,
    showGuest = true,
    returnTo = null,
}: SignUpScreenProps) {
    const schema = useMemo(() => signUpSchema(form.errors), [form.errors]);
    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignUpValues>({
        resolver: zodResolver(schema),
        defaultValues: { username: "", email: "", password: "", terms: false },
    });

    const { submit, pending, error } = useAuthSubmit(
        locale,
        form.errors,
        returnTo,
    );

    // The rule under the field fills in as it is met, so the password is watched
    // rather than only read at submit. `useWatch` rather than `watch`: it
    // subscribes through the control instead of handing back a function the
    // React Compiler has to give up on memoising the whole screen over.
    const password = useWatch({ control, name: "password" });
    const ruleMet = password.length >= PASSWORD_MIN;

    return (
        <AuthSplit
            asideSide="right"
            asideTone="sage"
            asideAlign="center"
            columns="lg:grid-cols-[55%_45%]"
            shadow="rust"
            aside={
                <>
                    <Heading size="card" className="max-w-[18ch]">
                        {copy.perksHeading}
                    </Heading>
                    <PerkList items={copy.perks} />
                </>
            }
        >
            <div className="flex flex-col gap-2">
                <Heading as="h1" size="cardHero">
                    {copy.heading}
                </Heading>
                <Text size="md">
                    {copy.already}{" "}
                    <TextLink
                        replace
                        href={withReturn(authPath(locale, "signIn"), returnTo)}
                        hardNavigation={standalone}
                        className="text-[17px] font-bold"
                    >
                        {copy.signIn}
                    </TextLink>
                    .
                </Text>
            </div>

            <form
                noValidate
                onSubmit={handleSubmit((values) =>
                    submit(
                        () =>
                            registerAccount(
                                values.username,
                                values.email,
                                values.password,
                            ),
                        form.errors.signUpFailed,
                    ),
                )}
                className="contents"
            >
                {error && <FormError>{error}</FormError>}

                {/* The account needs a name up front: the API's register call writes a
            NOT NULL UNIQUE username, so there is no later step to defer it to. */}
                <Field
                    htmlFor="username"
                    label={common.username}
                    error={errors.username?.message}
                >
                    <Input
                        id="username"
                        autoComplete="username"
                        {...invalidProps("username", errors.username)}
                        {...register("username")}
                    />
                </Field>

                <Field
                    htmlFor="email"
                    label={common.email}
                    error={errors.email?.message}
                >
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder={form.emailPlaceholder}
                        {...invalidProps("email", errors.email)}
                        {...register("email")}
                    />
                </Field>

                <Field
                    htmlFor="password"
                    label={common.password}
                    error={errors.password?.message}
                    hint={<RuleLine met={ruleMet}>{copy.rule}</RuleLine>}
                >
                    <PasswordInput
                        id="password"
                        autoComplete="new-password"
                        showLabel={common.show}
                        hideLabel={common.hide}
                        {...invalidProps("password", errors.password)}
                        {...register("password")}
                    />
                </Field>

                {/* The tickbox is its own field, so it carries its own line — the
            agreement is the thing being rejected, not the button. */}
                <div className="flex flex-col gap-[7px]">
                    <Checkbox
                        {...invalidProps("terms", errors.terms)}
                        {...register("terms")}
                    >
                        {copy.agreeLead}{" "}
                        <TextLink
                            hardNavigation
                            href={legalPath(locale, "terms")}
                            weight="semibold"
                        >
                            {copy.terms}
                        </TextLink>{" "}
                        {copy.agreeMid}{" "}
                        <TextLink
                            hardNavigation
                            href={legalPath(locale, "privacy")}
                            weight="semibold"
                        >
                            {copy.privacy}
                        </TextLink>
                        .
                    </Checkbox>
                    {errors.terms?.message && (
                        <FieldError id={errorId("terms")}>
                            {errors.terms.message}
                        </FieldError>
                    )}
                </div>

                <Button
                    type="submit"
                    tone="rust"
                    size="lg"
                    disabled={pending}
                    className="py-[17px] text-[18px] disabled:cursor-wait disabled:opacity-70"
                >
                    {copy.submit}
                </Button>
            </form>

            {showGuest && (
                <>
                    <LabeledRule className="pt-1">{copy.or}</LabeledRule>

                    <div className="flex flex-wrap items-center gap-4">
                        <Button
                            tone="cream"
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                                submit(
                                    loginAnonymous,
                                    form.errors.signInFailed,
                                )
                            }
                            className="text-[16px] disabled:cursor-wait disabled:opacity-70"
                        >
                            {copy.guest}
                        </Button>
                        <Text size="xs" className="max-w-[30ch]">
                            {copy.guestNote}
                        </Text>
                    </div>
                </>
            )}
        </AuthSplit>
    );
}
