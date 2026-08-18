"use client";

import { useRef, useState } from "react";

import { loginAnonymous } from "@/actions/auth";
import { Button, ButtonLink } from "@/components/controls/Button";
import FormError from "@/components/controls/FormError";
import MockLabel from "@/components/pages/table/blocks/MockLabel";
import { useAuthSubmit } from "@/components/pages/auth/useAuthSubmit";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { focusRing, pressSm } from "@/lib/styles";

type PlayModesProps = {
    copy: Dictionary["table"];
    errors: Dictionary["form"]["errors"];
    locale: Locale;
    /** Where ranked sends a player who isn't signed in. */
    signInHref: string;
};

/**
 * The one action on the screen, and the four things it can do.
 *
 * The button plays whatever is highlighted below it, so there is a single place
 * to press no matter which mode someone wants — picking a mode and starting a
 * game are one decision, not two screens' worth. Ranked is highlighted on
 * arrival because it is what the site is for.
 *
 * A guest can play everything except ranked, so three of the four start on the
 * spot: the button creates a throwaway account and puts the player in. Ranked
 * is the one that goes to the sign-in form, because a rating has to belong to
 * someone who will still exist tomorrow.
 */
export default function PlayModes({
    copy,
    errors,
    locale,
    signInHref,
}: PlayModesProps) {
    const { submit, pending, error } = useAuthSubmit(locale, errors);
    const [selectedId, setSelectedId] = useState("ranked");
    const tiles = useRef<(HTMLButtonElement | null)[]>([]);

    const modes = [
        {
            id: "ranked",
            title: copy.rules.ranked.title,
            note: copy.rules.ranked.note,
            /** The promise ranked makes that no open belote room can. */
            promise: copy.playRankedNote,
            guest: false,
        },
        {
            id: "casual",
            title: copy.rules.casual.title,
            note: copy.rules.casual.note,
            guest: true,
        },
        {
            id: "private",
            title: copy.rules.private.title,
            note: copy.rules.private.note,
            guest: true,
        },
        {
            id: "bots",
            title: copy.botsLabel,
            note: copy.botsNote,
            guest: true,
        },
    ];

    const selectedIndex = Math.max(
        modes.findIndex((mode) => mode.id === selectedId),
        0,
    );
    const selected = modes[selectedIndex]!;

    // Arrow keys select as they move, which is what a radio group does: the
    // choice follows focus rather than needing a second press to commit.
    function handleKeyDown(event: React.KeyboardEvent) {
        const step =
            event.key === "ArrowRight" || event.key === "ArrowDown"
                ? 1
                : event.key === "ArrowLeft" || event.key === "ArrowUp"
                  ? -1
                  : 0;
        if (step === 0) return;

        event.preventDefault();
        const next = (selectedIndex + step + modes.length) % modes.length;
        setSelectedId(modes[next]!.id);
        tiles.current[next]?.focus();
    }

    const playClass =
        "w-full py-5 text-center text-[19px] tracking-[-.02em] sm:py-6 sm:text-[23px]";

    return (
        <>
            <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-2">
                {/* Ranked leaves the page for the sign-in form, so it is a
                    link; the guest modes start where they stand, so they are a
                    button. Same block, and the same place on the screen. */}
                {selected.guest ? (
                    <Button
                        tone="rust"
                        size="lg"
                        disabled={pending}
                        onClick={() =>
                            submit(loginAnonymous, errors.signInFailed)
                        }
                        className={cn(playClass, "disabled:cursor-wait")}>
                        {copy.playNow}
                    </Button>
                ) : (
                    <ButtonLink
                        href={signInHref}
                        tone="rust"
                        size="lg"
                        className={playClass}>
                        {copy.playNow}
                    </ButtonLink>
                )}

                <p className="m-0 text-center text-[14px] font-semibold text-mint/75">
                    {selected.title} · {selected.promise ?? selected.note}
                </p>
            </div>

            <section
                aria-label={copy.gameModeLabel}
                className="flex flex-col gap-3">
                <MockLabel className="text-mint/70">
                    {copy.gameModeLabel}
                </MockLabel>

                {error && <FormError>{error}</FormError>}

                <div
                    role="radiogroup"
                    aria-label={copy.gameModeLabel}
                    onKeyDown={handleKeyDown}
                    className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {modes.map((mode, index) => {
                        const isSelected = index === selectedIndex;
                        return (
                            <button
                                key={mode.id}
                                ref={(node) => {
                                    tiles.current[index] = node;
                                }}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                // One tab stop for the group; arrows move
                                // within it, and the button above plays it.
                                tabIndex={isSelected ? 0 : -1}
                                onClick={() => setSelectedId(mode.id)}
                                className={cn(
                                    "flex cursor-pointer flex-col items-start gap-1 border-[3px] border-ink px-4 py-3 text-left shadow-hard-sm",
                                    pressSm,
                                    focusRing,
                                    // The shared ring is rust, which all but
                                    // disappears on the one tile filled rust.
                                    isSelected
                                        ? "bg-rust focus-visible:outline-cream"
                                        : "bg-baize-deep",
                                )}>
                                <span className="font-display text-[16px] font-extrabold tracking-[-.02em] text-cream">
                                    {mode.title}
                                </span>
                                <span
                                    className={cn(
                                        "text-[13px] font-semibold",
                                        isSelected ? "text-cream" : "text-ash",
                                    )}>
                                    {mode.note}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>
        </>
    );
}
