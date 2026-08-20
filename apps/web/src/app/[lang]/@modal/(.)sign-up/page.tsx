import SignUpScreen from "@/components/pages/auth/sections/SignUpScreen";
import Modal from "@/components/ui/surfaces/Modal";
import { localePage } from "@/dictionaries";
import { readGuestOffer, readReturnTo } from "@/lib/routes";
import { guardCredentialScreen } from "@/lib/session-guards";

/**
 * The sign-up half of the pair — see `(.)sign-in/page.tsx`.
 *
 * Not a gate. `dismissible={false}` made sense when the signed-out lobby
 * opened this form over itself — there was nothing behind it to go back to.
 * Now that the proxy turns a session-less visitor away before the lobby
 * renders, the only person who reaches this modal is one who chose it: a guest
 * trading up to a real account, who is entitled to change their mind.
 */
export default async function Page({
    params,
    searchParams,
}: PageProps<"/[lang]/sign-up">) {
    const { lang, dict } = await localePage(params);
    const search = await searchParams;
    const returnTo = readReturnTo(search, lang);
    const user = await guardCredentialScreen(lang, returnTo);

    return (
        <Modal closeLabel={dict.auth.common.back}>
            <SignUpScreen
                copy={dict.auth.signUp}
                common={dict.auth.common}
                form={dict.form}
                locale={lang}
                showGuest={user === null && readGuestOffer(search)}
                returnTo={returnTo}
            />
        </Modal>
    );
}
