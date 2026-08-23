import { redirect } from "next/navigation";

import GameScreen from "@/components/pages/game/sections/GameScreen";
import { localePage } from "@/dictionaries";
import { getInitialSession } from "@/actions/auth";
import { localeMetadata } from "@/lib/metadata";
import { signInPathWithReturn } from "@/lib/routes";
import { playPath } from "@/lib/routes";

export const generateMetadata = localeMetadata((dict) => ({
    title: dict.game.title,
    robots: { index: false, follow: false },
}));

/**
 * A table. Gated by `proxy.ts` on the presence of a refresh cookie, so a
 * signed-out visitor never reaches it.
 *
 * The session is read again here for the player themselves: the screen has to
 * know which of the four seats is theirs before the first `game:snapshot` lands,
 * and `useAuth` is seeded in an effect a pass later than that.
 */
export default async function Page({
    params,
}: PageProps<"/[lang]/play/[gameId]">) {
    const { lang, dict } = await localePage(params);
    const { gameId } = await params;
    const { user } = await getInitialSession();

    // The proxy's cookie check can pass on a session the backend has since
    // rejected, in which case there is nobody to seat.
    if (!user) {
        redirect(signInPathWithReturn(lang, playPath(lang, gameId)));
    }

    return (
        <GameScreen
            copy={dict.game}
            gameId={gameId}
            locale={lang}
            user={user}
        />
    );
}
