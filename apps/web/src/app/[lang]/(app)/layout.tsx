import { getInitialSession } from "@/actions/auth";
import AppNavigationFrame from "@/components/layout/AppNavigationFrame";
import GameNavigation from "@/components/layout/GameNavigation";
import SessionSupersededModal from "@/components/layout/SessionSupersededModal";
import { AuthProvider } from "@/context/auth-context";
import { GameProvider } from "@/context/game-context";
import { LobbyProvider } from "@/context/lobby-context";
import { SocketProvider } from "@/context/socket-context";
import { localePage } from "@/dictionaries";
import { cn } from "@/lib/ui/cn";
import { felt } from "@/lib/ui/styles";

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
 *
 * The socket hangs off the same boundary, and for the same reason: it needs the
 * access token `AuthProvider` seeds, and every route that speaks to the lobby is
 * under here. Opening one on the marketing page would authenticate nobody and
 * hold a `UserSession` open for nothing.
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
            <SocketProvider>
                {/* Above the lobby and the game both: taking the seat in
                    another window ends this one wherever it is standing. */}
                <SessionSupersededModal copy={dict.table.sessionSuperseded} />

                <LobbyProvider locale={lang}>
                    {/* Mounted here rather than on the play route, and that is
                        load-bearing: on reconnect the backend pushes
                        `game:snapshot` straight after `lobby:initialState`,
                        while the player is still standing on the lobby. A
                        provider that only mounted at `/play/[gameId]` would not
                        be listening yet and would miss the one frame it exists
                        to catch. */}
                    <GameProvider userId={user?.id ?? null}>
                        <div
                            data-felt=""
                            className={cn(felt, "flex min-h-screen flex-col")}
                        >
                            <AppNavigationFrame
                                locale={lang}
                                navigation={
                                    <GameNavigation
                                        copy={dict.table}
                                        locale={lang}
                                        user={user}
                                    />
                                }
                            >
                                {children}
                            </AppNavigationFrame>
                        </div>
                    </GameProvider>
                </LobbyProvider>
            </SocketProvider>
        </AuthProvider>
    );
}
