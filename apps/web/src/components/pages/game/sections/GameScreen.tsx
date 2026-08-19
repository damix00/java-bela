import { ButtonLink } from "@/components/controls/Button";
import Card from "@/components/ui/surfaces/Card";
import Chip from "@/components/ui/surfaces/Chip";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { homePath } from "@/lib/routes";
import { appGutters } from "@/lib/styles";
import { cn } from "@/lib/cn";

type GameScreenProps = {
  copy: Dictionary["game"];
  gameId: string;
  locale: Locale;
};

/**
 * The table, once there is one.
 *
 * A deliberate placeholder: the game runs over the WebSocket event system in
 * `apps/api` (`game:*` events, `@bela/protocol`), and none of that is wired up
 * yet. It exists now so the route, the session gate and the links into it are
 * real and can be tested.
 */
export default function GameScreen({ copy, gameId, locale }: GameScreenProps) {
  return (
    <main
      className={cn(
        "flex flex-1 flex-col justify-center py-10 md:py-16",
        appGutters,
      )}
    >
      <Card padding="lg" className="gap-5">
        <Chip className="self-start">{gameId}</Chip>
        <Heading as="h1" size="cardHero">
          {copy.heading}
        </Heading>
        <Text size="md" className="max-w-[48ch]">
          {copy.body}
        </Text>
        <ButtonLink
          href={homePath(locale)}
          tone="forest"
          size="md"
          className="self-start"
        >
          {copy.back}
        </ButtonLink>
      </Card>
    </main>
  );
}
