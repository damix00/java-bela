import { Button } from "@/components/controls/Button";
import Field from "@/components/controls/Field";
import PasswordInput from "@/components/controls/PasswordInput";
import AuthCard from "@/components/pages/auth/blocks/AuthCard";
import { demoAccount } from "@/components/pages/auth/placeholders";
import StrengthMeter from "@/components/pages/auth/blocks/StrengthMeter";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";

type ResetPasswordScreenProps = {
  copy: Dictionary["auth"]["reset"];
  common: Dictionary["auth"]["common"];
};

export default function ResetPasswordScreen({
  copy,
  common,
}: ResetPasswordScreenProps) {
  return (
    <AuthCard className="mx-auto max-w-[560px]">
      <Heading as="h1" size="cardHero">
        {copy.heading}
      </Heading>
      <Text size="md">{copy.body}</Text>

      <Field
        htmlFor="new-password"
        label={copy.label}
        // The meter is the field's own reading, so it lives with the field
        // rather than as another line in the card.
        hint={<StrengthMeter filled={3} label={copy.strength} />}
      >
        <PasswordInput
          id="new-password"
          autoComplete="new-password"
          showLabel={common.show}
          hideLabel={common.hide}
          defaultValue={demoAccount.password}
        />
      </Field>

      <Button tone="forest" size="lg" className="self-start">
        {copy.submit}
      </Button>
    </AuthCard>
  );
}
