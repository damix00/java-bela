import GameScreen from "@/components/pages/game/sections/GameScreen";
import { localePage } from "@/dictionaries";
import { localeMetadata } from "@/lib/metadata";

export const generateMetadata = localeMetadata((dict) => ({
  title: dict.game.title,
  robots: { index: false, follow: false },
}));

/**
 * A table. Gated by `proxy.ts` on the presence of a refresh cookie, so a
 * signed-out visitor never reaches it.
 */
export default async function Page({
  params,
}: PageProps<"/[lang]/play/[gameId]">) {
  const { lang, dict } = await localePage(params);
  const { gameId } = await params;

  return <GameScreen copy={dict.game} gameId={gameId} locale={lang} />;
}
