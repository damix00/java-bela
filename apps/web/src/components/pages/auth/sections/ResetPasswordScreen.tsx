"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/controls/Button";
import Field, { invalidProps } from "@/components/controls/Field";
import PasswordInput from "@/components/controls/PasswordInput";
import StrengthMeter from "@/components/pages/auth/blocks/forms/StrengthMeter";
import AuthCard from "@/components/pages/auth/blocks/layout/AuthCard";
import { onSubmitPlaceholder } from "@/components/pages/auth/placeholders";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";
import {
    passwordStrength,
    resetPasswordSchema,
    type ResetPasswordValues,
} from "@/lib/validation/schemas";

type ResetPasswordScreenProps = {
    copy: Dictionary["auth"]["reset"];
    common: Dictionary["auth"]["common"];
    errors: Dictionary["form"]["errors"];
};

export default function ResetPasswordScreen({
    copy,
    common,
    errors: messages,
}: ResetPasswordScreenProps) {
    const schema = useMemo(() => resetPasswordSchema(messages), [messages]);
    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordValues>({
        resolver: zodResolver(schema),
        defaultValues: { password: "" },
    });

    const password = useWatch({ control, name: "password" });
    const strength = passwordStrength(password);

    return (
        <AuthCard className="mx-auto max-w-[560px]">
            <Heading surface="felt" as="h1" size="cardHero">
                {copy.heading}
            </Heading>
            <Text surface="felt" size="md">
                {copy.body}
            </Text>

            <form
                noValidate
                onSubmit={handleSubmit(onSubmitPlaceholder)}
                className="contents"
            >
                <Field
                    surface="felt"
                    htmlFor="new-password"
                    label={copy.label}
                    error={errors.password?.message}
                    // The meter is the field's own reading, so it lives with the field
                    // rather than as another line in the card. It only appears once
                    // there is something to read: an empty field is not a weak one.
                    hint={
                        password ? (
                            <StrengthMeter
                                filled={strength}
                                label={copy.strength[strength - 1]}
                            />
                        ) : undefined
                    }
                >
                    <PasswordInput
                        surface="felt"
                        id="new-password"
                        autoComplete="new-password"
                        showLabel={common.show}
                        hideLabel={common.hide}
                        {...invalidProps("new-password", errors.password)}
                        {...register("password")}
                    />
                </Field>

                <Button
                    surface="felt"
                    type="submit"
                    tone="forest"
                    size="lg"
                    className="self-start"
                >
                    {copy.submit}
                </Button>
            </form>
        </AuthCard>
    );
}
