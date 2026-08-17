import { Button } from "@/components/controls/Button";
import Checkbox from "@/components/controls/Checkbox";
import Field from "@/components/controls/Field";
import Input from "@/components/controls/Input";
import PasswordInput from "@/components/controls/PasswordInput";
import AuthSplit from "@/components/pages/auth/blocks/AuthSplit";
import PerkList from "@/components/pages/auth/blocks/PerkList";
import RuleLine from "@/components/pages/auth/blocks/RuleLine";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import TextLink from "@/components/ui/typography/TextLink";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { authPath, legalPath } from "@/lib/routes";

type SignUpScreenProps = {
    copy: Dictionary["auth"]["signUp"];
    common: Dictionary["auth"]["common"];
    form: Dictionary["form"];
    locale: Locale;
};

/**
 * One password field, one live requirement, no confirm field — a second box to
 * retype into catches typos that the reveal toggle catches better.
 */
export default function SignUpScreen({
    copy,
    common,
    form,
    locale,
}: SignUpScreenProps) {
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
            }>
            <div className="flex flex-col gap-2">
                <Heading as="h1" size="cardHero">
                    {copy.heading}
                </Heading>
                <Text size="md">
                    {copy.already}{" "}
                    <TextLink
                        href={authPath(locale, "signIn")}
                        className="text-[17px] font-bold">
                        {copy.signIn}
                    </TextLink>
                    .
                </Text>
            </div>

            <Field htmlFor="email" label={common.email}>
                <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder={form.emailPlaceholder}
                />
            </Field>

            <Field
                htmlFor="password"
                label={common.password}
                hint={<RuleLine>{copy.rule}</RuleLine>}>
                <PasswordInput
                    id="password"
                    autoComplete="new-password"
                    showLabel={common.show}
                    hideLabel={common.hide}
                />
            </Field>

            <Checkbox>
                {copy.agreeLead}{" "}
                <TextLink href={legalPath(locale, "terms")} weight="semibold">
                    {copy.terms}
                </TextLink>{" "}
                {copy.agreeMid}{" "}
                <TextLink href={legalPath(locale, "privacy")} weight="semibold">
                    {copy.privacy}
                </TextLink>
                .
            </Checkbox>

            <Button tone="rust" size="lg" className="py-[17px] text-[18px]">
                {copy.submit}
            </Button>
        </AuthSplit>
    );
}
