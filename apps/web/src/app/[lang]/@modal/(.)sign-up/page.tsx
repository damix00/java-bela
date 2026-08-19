import SignUpScreen from "@/components/pages/auth/sections/SignUpScreen";
import Modal from "@/components/ui/surfaces/Modal";
import { localePage } from "@/dictionaries";
import { readReturnTo } from "@/lib/routes";
import { guardCredentialScreen } from "@/lib/session-guards";

/** The sign-up half of the pair — see `(.)sign-in/page.tsx`. */
export default async function Page({
    params,
    searchParams,
}: PageProps<"/[lang]/sign-up">) {
    const { lang, dict } = await localePage(params);
    const returnTo = readReturnTo(await searchParams, lang);
    await guardCredentialScreen(lang, returnTo);

    return (
        <Modal closeLabel={dict.auth.common.back} dismissible={false}>
            <SignUpScreen
                copy={dict.auth.signUp}
                common={dict.auth.common}
                form={dict.form}
                locale={lang}
                returnTo={returnTo}
            />
        </Modal>
    );
}
