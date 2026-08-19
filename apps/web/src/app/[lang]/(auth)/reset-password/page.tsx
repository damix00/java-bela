import ResetPasswordScreen from "@/components/pages/auth/sections/ResetPasswordScreen";
import { localePage } from "@/dictionaries";
import { guardCredentialScreen } from "@/lib/session-guards";
import { localeMetadata } from "@/lib/metadata";

export const generateMetadata = localeMetadata((dict) => dict.auth.reset.title);

export default async function Page({
    params,
}: PageProps<"/[lang]/reset-password">) {
    const { lang, dict } = await localePage(params);
    await guardCredentialScreen(lang);

    return (
        <ResetPasswordScreen
            copy={dict.auth.reset}
            common={dict.auth.common}
            errors={dict.form.errors}
        />
    );
}
