"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/controls/Button";
import CodeInput from "@/components/controls/CodeInput";
import { errorId } from "@/components/controls/Field";
import FieldError from "@/components/controls/FieldError";
import AuthCard from "@/components/pages/auth/blocks/AuthCard";
import {
  demoAccount,
  onSubmitPlaceholder,
} from "@/components/pages/auth/placeholders";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import TextLink from "@/components/ui/typography/TextLink";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { authPath } from "@/lib/routes";
import {
  CODE_LENGTH,
  twoFactorSchema,
  type TwoFactorValues,
} from "@/lib/validation";

type TwoFactorScreenProps = {
  copy: Dictionary["auth"]["twoFactor"];
  common: Dictionary["auth"]["common"];
  errors: Dictionary["form"]["errors"];
  locale: Locale;
};

/**
 * The code prompt. `Controller` rather than `register`: the six boxes are one
 * value with a caret that moves between them, which is more than a ref on an
 * input can express.
 */
export default function TwoFactorScreen({
  copy,
  common,
  errors: messages,
  locale,
}: TwoFactorScreenProps) {
  const schema = useMemo(() => twoFactorSchema(messages), [messages]);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TwoFactorValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: demoAccount.code },
  });

  return (
    <AuthCard shadow="rust" className="mx-auto max-w-[560px] gap-[22px]">
      <Heading as="h1" size="cardHero">
        {copy.heading}
      </Heading>
      <Text size="md" className="max-w-[36ch]">
        {copy.body}
      </Text>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmitPlaceholder)}
        className="contents"
      >
        <div className="flex flex-col gap-[7px]">
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <CodeInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                length={CODE_LENGTH}
                digitLabel={common.digit}
                invalid={Boolean(errors.code)}
                describedBy={errors.code && errorId("code")}
              />
            )}
          />
          {errors.code?.message && (
            <FieldError id={errorId("code")}>{errors.code.message}</FieldError>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <Button type="submit" tone="ink" size="lg">
            {copy.submit}
          </Button>
          <TextLink href={authPath(locale, "signIn")} weight="semibold">
            {copy.recovery}
          </TextLink>
        </div>
      </form>
    </AuthCard>
  );
}
