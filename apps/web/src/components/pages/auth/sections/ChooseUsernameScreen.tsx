"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/controls/Button";
import Field, { invalidProps } from "@/components/controls/Field";
import AuthSplit from "@/components/pages/auth/blocks/layout/AuthSplit";
import AvatarPicker, {
    AVATAR_GLYPHS,
} from "@/components/pages/auth/blocks/forms/AvatarPicker";
import LadderPreview from "@/components/pages/auth/blocks/rating/LadderPreview";
import {
    demoAccount,
    onSubmitPlaceholder,
} from "@/components/pages/auth/placeholders";
import Eyebrow from "@/components/ui/typography/Eyebrow";
import Heading from "@/components/ui/typography/Heading";
import Text from "@/components/ui/typography/Text";
import type { Dictionary } from "@/dictionaries";
import { focusRing, inputBare, inputFrame } from "@/lib/ui/styles";
import { usernameSchema, type UsernameValues } from "@/lib/validation/schemas";

type ChooseUsernameScreenProps = {
    copy: Dictionary["auth"]["username"];
    common: Dictionary["auth"]["common"];
    errors: Dictionary["form"]["errors"];
};

/**
 * The one thing asked after verification. A client component because the
 * chosen avatar has to show up in the ladder preview on the other side of the
 * card — the point of the screen is seeing the name where it will land.
 */
export default function ChooseUsernameScreen({
    copy,
    common,
    errors: messages,
}: ChooseUsernameScreenProps) {
    const schema = useMemo(() => usernameSchema(messages), [messages]);
    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<UsernameValues>({
        resolver: zodResolver(schema),
        // Validating as it is typed, because the preview beside the field is
        // already reacting to every keystroke — a name that has gone bad should
        // not keep rendering as a ladder row.
        mode: "onChange",
        defaultValues: { username: demoAccount.username, avatar: 0 },
    });

    const avatar = useWatch({ control, name: "avatar" });
    const username = useWatch({ control, name: "username" });

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
                                name: username,
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

            <form
                noValidate
                onSubmit={handleSubmit(onSubmitPlaceholder)}
                className="contents"
            >
                <Field
                    htmlFor="username"
                    label={copy.label}
                    hint={copy.hint}
                    error={errors.username?.message}
                >
                    <div className={inputFrame}>
                        <input
                            id="username"
                            autoComplete="nickname"
                            className={`${focusRing} ${inputBare}`}
                            {...invalidProps("username", errors.username)}
                            {...register("username")}
                        />
                        {/* Availability is stated, not iconified: the word is shorter to
                read than a tick is to decode. It waits for a name the rules
                accept — nothing can be said about one that won't be asked
                about. */}
                        {username && !errors.username && (
                            <Eyebrow
                                tone="forest"
                                className="pr-4 tracking-[.08em]"
                            >
                                {copy.available}
                            </Eyebrow>
                        )}
                    </div>
                </Field>

                <Controller
                    name="avatar"
                    control={control}
                    render={({ field }) => (
                        <AvatarPicker
                            label={copy.avatar}
                            optionLabel={common.avatarOption}
                            value={field.value}
                            onChange={field.onChange}
                        />
                    )}
                />

                <Button
                    type="submit"
                    tone="forest"
                    size="lg"
                    className="self-start py-[17px] text-[18px]"
                >
                    {copy.submit}
                </Button>
            </form>
        </AuthSplit>
    );
}
