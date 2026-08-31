import { redirect } from "next/navigation";

import { getCurrentUser } from "@/actions/auth";
import { isGuest } from "@/api/types/user";
import ProfileScreen from "@/components/pages/profile/sections/ProfileScreen";
import { localePage } from "@/dictionaries";
import { countryOptions } from "@/lib/i18n/countries";
import { localeMetadata } from "@/lib/i18n/metadata";
import {
    homePath,
    profilePath,
    signInPathWithReturn,
} from "@/lib/navigation/routes";

// One player's own page, and nobody else's business — the same `noindex` the
// lobby carries, for the same reason.
export const generateMetadata = localeMetadata((dict) => ({
    title: dict.profile.title,
    robots: { index: false, follow: false },
}));

/**
 * The proxy already turns away anyone without a session, so the first redirect
 * here is the belt to its braces — and the thing that narrows `user` from
 * `User | null` for the screen below.
 *
 * The second is the real guard. A guest has no profile: the name was handed out
 * by the server for a day and the API refuses to change it, so there is nothing
 * on this page for one to do. The proxy can't make this call — it reads the
 * cookie for a session, not for which kind.
 *
 * The lobby, and deliberately *not* sign-up, which is where a guest actually
 * wants to end up. `@modal/(.)sign-up` intercepts client-side navigation to
 * that URL, and an intercepted route re-renders the page underneath it — this
 * one, which redirects again, which intercepts again. That is the ping-pong
 * `proxy.ts` describes, and it runs until the browser refuses any more
 * `history.replaceState()` calls. No gated route may redirect to an intercepted
 * one. The guest is offered the account on the two screens that can say it in
 * their own words instead: the avatar menu and settings.
 */
export default async function Page({ params }: PageProps<"/[lang]/profile">) {
    const { lang, dict } = await localePage(params);
    const user = await getCurrentUser();

    if (!user) {
        redirect(signInPathWithReturn(lang, profilePath(lang)));
    }

    if (isGuest(user)) {
        redirect(homePath(lang));
    }

    return (
        <ProfileScreen
            copy={dict.profile}
            errors={dict.form.errors}
            locale={lang}
            user={user}
            countries={countryOptions(lang)}
        />
    );
}
