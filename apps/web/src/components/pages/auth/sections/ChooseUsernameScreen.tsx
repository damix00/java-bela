"use client";

import { useState } from "react";

import { Button } from "@/components/controls/Button";
import Field from "@/components/controls/Field";
import AuthSplit from "@/components/pages/auth/blocks/AuthSplit";
import AvatarPicker, {
  AVATAR_GLYPHS,
} from "@/components/pages/auth/blocks/AvatarPicker";
import LadderPreview from "@/components/pages/auth/blocks/LadderPreview";
import { demoAccount } from "@/components/pages/auth/placeholders";
import Eyebrow from "@/components/ui/typography/Eyebrow";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";
import { focusRing, inputBare, inputFrame } from "@/lib/styles";

type ChooseUsernameScreenProps = {
  copy: Dictionary["auth"]["username"];
  common: Dictionary["auth"]["common"];
};

/**
 * The one thing asked after verification. A client component because the
 * chosen avatar has to show up in the ladder preview on the other side of the
 * card — the point of the screen is seeing the name where it will land.
 */
export default function ChooseUsernameScreen({
  copy,
  common,
}: ChooseUsernameScreenProps) {
  const [avatar, setAvatar] = useState(0);

  return (
    <AuthSplit
      asideSide="right"
      asideTone="sage"
      asideAlign="center"
      stackOrder="asideLast"
      columns="lg:grid-cols-[56%_44%]"
      aside={
        <>
          <Eyebrow>{copy.previewLabel}</Eyebrow>
          <LadderPreview
            rows={[
              {
                rank: demoAccount.ladderRank,
                name: demoAccount.username,
                rating: copy.unrated,
                glyph: AVATAR_GLYPHS[avatar],
              },
              {
                rank: demoAccount.neighbourRank,
                name: demoAccount.neighbourName,
                rating: demoAccount.neighbourRating,
              },
            ]}
          />
          <Text size="xs" className="max-w-[30ch]">
            {copy.note}
          </Text>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <Eyebrow>{copy.step}</Eyebrow>
        <Heading as="h1" size="cardHero">
          {copy.heading}
        </Heading>
      </div>

      <Field htmlFor="username" label={copy.label} hint={copy.hint}>
        <div className={inputFrame}>
          <input
            id="username"
            defaultValue={demoAccount.username}
            autoComplete="username"
            className={`${focusRing} ${inputBare}`}
          />
          {/* Availability is stated, not iconified: the word is shorter to
              read than a tick is to decode. */}
          <Eyebrow tone="forest" className="pr-4 tracking-[.08em]">
            {copy.available}
          </Eyebrow>
        </div>
      </Field>

      <AvatarPicker
        label={copy.avatar}
        optionLabel={common.avatarOption}
        value={avatar}
        onChange={setAvatar}
      />

      <Button tone="forest" size="lg" className="self-start py-[17px] text-[18px]">
        {copy.submit}
      </Button>
    </AuthSplit>
  );
}
