import { Mail } from "lucide-react";

import { Button } from "@/components/controls/Button";
import AuthCard from "@/components/pages/auth/blocks/AuthCard";
import { demoAccount } from "@/components/pages/auth/placeholders";
import { IconBadge } from "@/components/ui/graphics/Icon";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";

type CheckEmailScreenProps = {
  copy: Dictionary["auth"]["checkEmail"];
};

/**
 * The confirmation never says whether the address has an account — the
 * sentence is conditional on purpose, so this page can't be used to check who
 * has registered.
 */
export default function CheckEmailScreen({ copy }: CheckEmailScreenProps) {
  return (
    <AuthCard tone="sage" className="mx-auto max-w-[560px]">
      <IconBadge glyph={Mail} size="lg" className="size-16" />

      <Heading as="h1" size="cardHero">
        {copy.heading}
      </Heading>
      <Text size="md" tone="ink" className="max-w-[34ch]">
        {copy.bodyLead} <strong className="font-bold">{demoAccount.email}</strong>{" "}
        {copy.bodyRest}
      </Text>

      <div className="flex flex-wrap items-center gap-[18px]">
        <Button tone="cream" size="sm" className="text-[16px]">
          {copy.resend}
        </Button>
        <Text as="span" size="xs" className="font-mono text-[12px] text-stone">
          {copy.timer}
        </Text>
      </div>
    </AuthCard>
  );
}
