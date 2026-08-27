import ForgotPasswordScreen from "@/components/pages/auth/sections/ForgotPasswordScreen";
import { localePage } from "@/dictionaries";
import { guardCredentialScreen } from "@/lib/auth/session-guards";
import { localeMetadata } from "@/lib/i18n/metadata";

export const generateMetadata = localeMetadata(
    (dict) => dict.auth.forgot.title,
);

export default async function Page({
    params,
}: PageProps<"/[lang]/forgot-password">) {
    const { lang, dict } = await localePage(params);
    await guardCredentialScreen(lang);

    return (
        <ForgotPasswordScreen
            copy={dict.auth.forgot}
            common={dict.auth.common}
            form={dict.form}
            locale={lang}
        />
    );
}
