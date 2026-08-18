import { getInitialSession } from "@/actions/auth";
import { AuthProvider } from "@/context/auth-context";

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
}: LayoutProps<"/[lang]">) {
  // Cookies only, no backend round trip. This seeds the client token store; the
  // session itself lives in the httpOnly cookies the server actions wrote.
  const { user, token, expiresAt } = await getInitialSession();

  return (
    <AuthProvider
      initialUser={user}
      initialToken={token}
      initialExpiresAt={expiresAt}
    >
      {children}
    </AuthProvider>
  );
}
