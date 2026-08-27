import { redirect } from "next/navigation";

import { getCurrentUser } from "@/actions/auth";
import JoinScreen from "@/components/pages/lobby/sections/JoinScreen";
import { localePage } from "@/dictionaries";
import { localeMetadata } from "@/lib/i18n/metadata";
import { authPath } from "@/lib/navigation/routes";

export const generateMetadata = localeMetadata((dict) => ({
    title: dict.table.join.heading,
    robots: { index: false, follow: false },
}));

/**
 * An invite link, arriving from wherever it was pasted.
 *
 * It lives under `(app)` so it inherits the socket and the lobby state — the
 * join is a socket command, not a request, and there is no REST endpoint that
 * could serve this page's real work. The route group adds nothing to the URL,
 * so the link people share is still `/[lang]/join/ABC123`.
 *
 * The proxy has already turned away anyone without a session and folded this
 * path into `?next=`, which is what lets someone click a friend's link while
 * signed out and still land at the table afterwards. The `redirect` below is
 * only the belt to that braces.
 */
export default async function Page({
    params,
}: PageProps<"/[lang]/join/[code]">) {
    const [{ lang, dict }, { code }] = await Promise.all([
        localePage(params),
        params,
    ]);

    const user = await getCurrentUser();
    if (!user) {
        redirect(authPath(lang, "signIn"));
    }

    return <JoinScreen copy={dict.table} locale={lang} code={code} />;
}
