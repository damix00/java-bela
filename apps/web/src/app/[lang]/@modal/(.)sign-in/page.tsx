import SignInScreen from "@/components/pages/auth/sections/SignInScreen";
import Modal from "@/components/ui/surfaces/Modal";
import { localePage } from "@/dictionaries";
import { readReturnTo } from "@/lib/routes";
import { guardCredentialScreen } from "@/lib/session-guards";

/**
 * `/[lang]/sign-in` reached by a click from inside the app: the same screen the
 * standalone page renders, laid over whatever the player was looking at.
 *
 * A hard load or a refresh of this URL skips the interception entirely and
 * renders `(auth)/sign-in/page.tsx` instead, which is why the screen component
 * is shared rather than duplicated.
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
}: PageProps<"/[lang]/sign-in">) {
    const { lang, dict } = await localePage(params);
    const returnTo = readReturnTo(await searchParams, lang);
    await guardCredentialScreen(lang, returnTo);

    return (
        <Modal closeLabel={dict.auth.common.back}>
            <SignInScreen
                copy={dict.auth.signIn}
                common={dict.auth.common}
                errors={dict.form.errors}
                locale={lang}
                returnTo={returnTo}
            />
        </Modal>
    );
}
