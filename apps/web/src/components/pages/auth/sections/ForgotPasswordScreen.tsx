"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/controls/Button";
import Field, { invalidProps } from "@/components/controls/Field";
import Input from "@/components/controls/Input";
import AuthCard from "@/components/pages/auth/blocks/layout/AuthCard";
import { onSubmitPlaceholder } from "@/components/pages/auth/placeholders";
import Icon from "@/components/ui/graphics/Icon";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import TextLink from "@/components/ui/typography/TextLink";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { authPath } from "@/lib/navigation/routes";
import {
    forgotPasswordSchema,
    type ForgotPasswordValues,
} from "@/lib/validation/schemas";

type ForgotPasswordScreenProps = {
    copy: Dictionary["auth"]["forgot"];
    common: Dictionary["auth"]["common"];
    form: Dictionary["form"];
    locale: Locale;
};

export default function ForgotPasswordScreen({
    copy,
    common,
    form,
    locale,
}: ForgotPasswordScreenProps) {
    const schema = useMemo(
        () => forgotPasswordSchema(form.errors),
        [form.errors],
    );
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: "" },
    });

    return (
        <AuthCard className="mx-auto max-w-[560px]">
            <TextLink
                surface="felt"
                href={authPath(locale, "signIn")}
                weight="semibold"
                className="flex items-center gap-2 self-start text-[12px] tracking-[.06em] uppercase"
            >
                <Icon glyph={ArrowLeft} size="sm" tone="mint" />
                {common.backToSignIn}
            </TextLink>

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
                    htmlFor="email"
                    label={common.email}
                    error={errors.email?.message}
                >
                    <Input
                        surface="felt"
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder={form.emailPlaceholder}
                        {...invalidProps("email", errors.email)}
                        {...register("email")}
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
