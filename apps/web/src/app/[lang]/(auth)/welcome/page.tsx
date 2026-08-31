import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/actions/auth";
import { WELCOME_COOKIE } from "@/actions/cookies";
import { isGuest } from "@/api/types/user";
import WelcomeScreen from "@/components/pages/auth/sections/WelcomeScreen";
import { localePage } from "@/dictionaries";
import { countryOptions } from "@/lib/i18n/countries";
import { localeMetadata } from "@/lib/i18n/metadata";
import { homePath } from "@/lib/navigation/routes";

// The tail of somebody's sign-up, with their name on it — `noindex`, for the
// reason the profile carries one.
export const generateMetadata = localeMetadata((dict) => ({
    title: dict.auth.welcome.title,
    robots: { index: false, follow: false },
}));

/**
 * The step between sign-up and the lobby: a bio and a country, or neither.
 *
 * Every way out of it is the lobby, and deliberately never `sign-in` or
 * `sign-up`. Those two have `@modal` interceptors, and a gated route that
 * redirects to an intercepted one ping-pongs — the modal re-renders the page
 * that redirected, which redirects again — until the browser refuses any more
 * `history.replaceState()` calls. `proxy.ts` gates the lobby too, so a visitor
 * with no session still ends up at the sign-in screen; they just get there
 * through the one thing that can send them without interception.
 */
export default async function Page({ params }: PageProps<"/[lang]/welcome">) {
    const { lang, dict } = await localePage(params);
    const user = await getCurrentUser();

    // Unreachable in practice — the proxy gates `welcome` on a session — and
    // kept because it is what narrows `User | null` for the screen below.
    if (!user) {
        redirect(homePath(lang));
    }

    // A guest has nothing to save here: the API answers `PATCH /users/me` with
    // 403 for an anonymous account, the same reason `/profile` turns them away.
    if (isGuest(user)) {
        redirect(homePath(lang));
    }

    // Answered once, gone for good on this browser. Read here rather than in
    // the proxy: it is this page's own policy, not a session fact, and reading
    // it server-side is what keeps a bookmark or a Back from flashing a step
    // the player has already dealt with.
    const dismissed = (await cookies()).has(WELCOME_COOKIE);
    if (dismissed) {
        redirect(homePath(lang));
    }

    return (
        <WelcomeScreen
            copy={dict.auth.welcome}
            profile={dict.profile}
            errors={dict.form.errors}
            locale={lang}
            username={user.username}
            avatarUrl={user.avatarUrl}
            countries={countryOptions(lang)}
        />
    );
}
