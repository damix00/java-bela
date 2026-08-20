import { getInitialSession } from "@/actions/auth";
import GameNavigation from "@/components/layout/GameNavigation";
import { AuthProvider } from "@/context/auth-context";
import { localePage } from "@/dictionaries";
import { cn } from "@/lib/cn";
import { felt } from "@/lib/styles";

/**
 * Wraps the signed-in surfaces — the lobby and the tables — and nothing else.
 *
 * The session read has to live at *some* layout, and putting it on `[lang]`
 * would be the obvious place. It can't: reading cookies opts a route into
 * dynamic rendering, and a session read on the root layout drags the landing
 * page and the legal documents down with it. Those are the pages that need to
 * be static — they are the indexable ones.
 *
 * So the boundary sits here instead. These routes are per-visitor anyway.
 */
export default async function AppLayout({
    children,
    params,
}: LayoutProps<"/[lang]">) {
    // Cookies only, no backend round trip. This seeds the client token store; the
    // session itself lives in the httpOnly cookies the server actions wrote.
    const [{ lang, dict }, { user, token, expiresAt }] = await Promise.all([
        localePage(params),
        getInitialSession(),
    ]);

    return (
        <AuthProvider
            initialUser={user}
            initialToken={token}
            initialExpiresAt={expiresAt}
        >
            <div data-felt="" className={cn(felt, "flex min-h-screen flex-col")}>
                <GameNavigation copy={dict.table} locale={lang} user={user} />
                <div className="flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-0">
                    {children}
                </div>
            </div>
        </AuthProvider>
    );
}
