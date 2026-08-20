import SignUpScreen from "@/components/pages/auth/sections/SignUpScreen";
import { localePage } from "@/dictionaries";
import { localeMetadata } from "@/lib/metadata";
import { readReturnTo } from "@/lib/routes";
import { guardCredentialScreen } from "@/lib/session-guards";

export const generateMetadata = localeMetadata(
    (dict) => dict.auth.signUp.title,
);

export default async function Page({
    params,
    searchParams,
}: PageProps<"/[lang]/sign-up">) {
    const { lang, dict } = await localePage(params);
    const returnTo = readReturnTo(await searchParams, lang);
    const user = await guardCredentialScreen(lang, returnTo);

    return (
        <SignUpScreen
            copy={dict.auth.signUp}
            common={dict.auth.common}
            form={dict.form}
            locale={lang}
            standalone
            showGuest={user === null}
            returnTo={returnTo}
        />
    );
}
