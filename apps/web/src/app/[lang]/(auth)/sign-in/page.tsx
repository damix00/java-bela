import SignInScreen from "@/components/pages/auth/sections/SignInScreen";
import { localePage } from "@/dictionaries";
import { localeMetadata } from "@/lib/i18n/metadata";
import { readGuestOffer, readReturnTo } from "@/lib/navigation/routes";
import { guardCredentialScreen } from "@/lib/auth/session-guards";

export const generateMetadata = localeMetadata(
    (dict) => dict.auth.signIn.title,
);

export default async function Page({
    params,
    searchParams,
}: PageProps<"/[lang]/sign-in">) {
    const { lang, dict } = await localePage(params);
    const search = await searchParams;
    const returnTo = readReturnTo(search, lang);
    const user = await guardCredentialScreen(lang, returnTo);

    return (
        <SignInScreen
            copy={dict.auth.signIn}
            common={dict.auth.common}
            errors={dict.form.errors}
            locale={lang}
            standalone
            returnTo={returnTo}
            showGuest={user === null}
            offerGuestOnSignUp={readGuestOffer(search)}
        />
    );
}
