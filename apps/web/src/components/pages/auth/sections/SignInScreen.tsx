import { Button } from "@/components/controls/Button";
import Checkbox from "@/components/controls/Checkbox";
import Field from "@/components/controls/Field";
import Input from "@/components/controls/Input";
import PasswordInput from "@/components/controls/PasswordInput";
import AuthSplit from "@/components/pages/auth/blocks/AuthSplit";
import RatingBadge from "@/components/pages/auth/blocks/RatingBadge";
import { demoAccount } from "@/components/pages/auth/placeholders";
import Logo from "@/components/ui/brand/Logo";
import LabeledRule from "@/components/ui/surfaces/LabeledRule";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import TextLink from "@/components/ui/typography/TextLink";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { authPath } from "@/lib/routes";

type SignInScreenProps = {
    copy: Dictionary["auth"]["signIn"];
    common: Dictionary["auth"]["common"];
    locale: Locale;
};

/**
 * Returning player. Guest play sits below the fold of the form and never above
 * it — the account is the offer, the guest table is the fallback.
 *
 * Nothing here submits yet: the fields are visual until the auth backend
 * lands, which is also why they carry demo values rather than placeholders.
 */
export default function SignInScreen({
    copy,
    common,
    locale,
}: SignInScreenProps) {
    return (
        <AuthSplit
            aside={
                <>
                    <Logo withMark tone="cream" />
                    <div className="flex flex-col gap-[26px]">
                        <Heading
                            size="cardHero"
                            tone="cream"
                            className="max-w-[16ch]">
                            {copy.promo}
                        </Heading>
                    </div>
                </>
            }>
            <div className="flex flex-col gap-2">
                <Heading as="h1" size="cardHero">
                    {copy.heading}
                </Heading>
                <Text size="md">
                    {copy.noAccount}{" "}
                    <TextLink
                        href={authPath(locale, "signUp")}
                        className="text-[17px] font-bold">
                        {copy.createOne}
                    </TextLink>
                    .
                </Text>
            </div>

            <Field htmlFor="email" label={common.email}>
                <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    defaultValue={demoAccount.email}
                />
            </Field>

            <Field
                htmlFor="password"
                label={common.password}
                action={
                    <TextLink
                        href={authPath(locale, "forgotPassword")}
                        weight="semibold"
                        className="text-[14px]">
                        {copy.forgot}
                    </TextLink>
                }>
                <PasswordInput
                    id="password"
                    showLabel={common.show}
                    hideLabel={common.hide}
                    defaultValue={demoAccount.password}
                />
            </Field>

            <Checkbox defaultChecked>{copy.remember}</Checkbox>

            <Button tone="forest" size="lg" className="py-[17px] text-[18px]">
                {copy.submit}
            </Button>

            <LabeledRule className="pt-1">{copy.or}</LabeledRule>

            <div className="flex flex-wrap items-center gap-4">
                <Button tone="cream" size="sm" className="text-[16px]">
                    {copy.guest}
                </Button>
                <Text size="xs" className="max-w-[30ch]">
                    {copy.guestNote}
                </Text>
            </div>
        </AuthSplit>
    );
}
