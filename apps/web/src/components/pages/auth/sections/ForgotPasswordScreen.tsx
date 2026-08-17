import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/controls/Button";
import Field from "@/components/controls/Field";
import Input from "@/components/controls/Input";
import AuthCard from "@/components/pages/auth/blocks/AuthCard";
import Icon from "@/components/ui/graphics/Icon";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import TextLink from "@/components/ui/typography/TextLink";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { authPath } from "@/lib/routes";

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
  return (
    <AuthCard className="mx-auto max-w-[560px]">
      <TextLink
        href={authPath(locale, "signIn")}
        weight="semibold"
        className="flex items-center gap-2 self-start font-mono text-[12px] tracking-[.06em] uppercase"
      >
        <Icon glyph={ArrowLeft} size="sm" />
        {common.backToSignIn}
      </TextLink>

      <Heading as="h1" size="cardHero">
        {copy.heading}
      </Heading>
      <Text size="md">{copy.body}</Text>

      <Field htmlFor="email" label={common.email}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={form.emailPlaceholder}
        />
      </Field>

      <Button tone="forest" size="lg" className="self-start">
        {copy.submit}
      </Button>
    </AuthCard>
  );
}
