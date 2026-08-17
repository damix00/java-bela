import { Button } from "@/components/controls/Button";
import CodeInput from "@/components/controls/CodeInput";
import AuthCard from "@/components/pages/auth/blocks/AuthCard";
import { demoAccount } from "@/components/pages/auth/placeholders";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import TextLink from "@/components/ui/typography/TextLink";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { authPath } from "@/lib/routes";

type TwoFactorScreenProps = {
  copy: Dictionary["auth"]["twoFactor"];
  common: Dictionary["auth"]["common"];
  locale: Locale;
};

export default function TwoFactorScreen({
  copy,
  common,
  locale,
}: TwoFactorScreenProps) {
  return (
    <AuthCard shadow="rust" className="mx-auto max-w-[560px] gap-[22px]">
      <Heading as="h1" size="cardHero">
        {copy.heading}
      </Heading>
      <Text size="md" className="max-w-[36ch]">
        {copy.body}
      </Text>

      <CodeInput
        defaultValue={[...demoAccount.code]}
        digitLabel={common.digit}
      />

      <div className="flex flex-wrap items-center gap-5">
        <Button tone="ink" size="lg">
          {copy.submit}
        </Button>
        <TextLink href={authPath(locale, "signIn")} weight="semibold">
          {copy.recovery}
        </TextLink>
      </div>
    </AuthCard>
  );
}
