"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { loginAnonymous } from "@/actions/auth";
import { Button, ButtonLink } from "@/components/controls/Button";
import FormError from "@/components/controls/FormError";
import MockLabel from "@/components/pages/table/blocks/MockLabel";
import { useAuthSubmit } from "@/components/pages/auth/useAuthSubmit";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { focusRing, pressSm } from "@/lib/styles";
import { useAuth } from "@/context/auth-context";

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
 * It is built as a band rather than a pair of controls floating on the felt: on
 * its own darker surface, centred under the table it starts, and sized to its
 * contents rather than to the page. The frame is what makes it read as the one
 * thing to press; stretching that frame the full width of a 1920 screen would
 * only put air between the two controls inside it. On a phone there is no such
 * spare width, so it takes the column.
 *
 * The compact control names the current mode and opens the rest on demand; the
 * button beside it plays that choice. Ranked is highlighted on arrival because
 * it is what the site is for.
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
    const [open, setOpen] = useState(false);
    const listboxId = useId();
    const selector = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const listbox = useRef<HTMLDivElement>(null);
    const auth = useAuth();

    const modes = useMemo(
        () => [
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
        ],
        [copy],
    );

    const selectedIndex = Math.max(
        modes.findIndex((mode) => mode.id === selectedId),
        0,
    );
    const selected = modes[selectedIndex]!;

    useEffect(() => {
        if (!open) return;
        listbox.current?.focus();

        const closeOnOutsidePress = (event: PointerEvent) => {
            if (!selector.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("pointerdown", closeOnOutsidePress);
        return () =>
            document.removeEventListener("pointerdown", closeOnOutsidePress);
    }, [open]);

    function closeListbox({ restoreFocus = true } = {}) {
        setOpen(false);
        if (restoreFocus) trigger.current?.focus();
    }

    function selectMode(index: number) {
        setSelectedId(modes[index]!.id);
        closeListbox();
    }

    function handleTriggerKeyDown(event: React.KeyboardEvent) {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

        event.preventDefault();
        setOpen(true);
    }

    function handleListboxKeyDown(event: React.KeyboardEvent) {
        let next: number | null = null;

        if (event.key === "ArrowDown") {
            next = (selectedIndex + 1) % modes.length;
        } else if (event.key === "ArrowUp") {
            next = (selectedIndex - 1 + modes.length) % modes.length;
        } else if (event.key === "Home") {
            next = 0;
        } else if (event.key === "End") {
            next = modes.length - 1;
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectMode(selectedIndex);
            return;
        } else if (event.key === "Escape") {
            event.preventDefault();
            closeListbox();
            return;
        } else if (event.key === "Tab") {
            closeListbox({ restoreFocus: false });
            return;
        } else {
            return;
        }

        event.preventDefault();
        if (next === null) return;
        setSelectedId(modes[next]!.id);
    }

    const playClass =
        "h-full min-h-[68px] w-full py-4 text-center text-[19px] tracking-[-.02em] sm:text-[21px]";

    return (
        <section
            aria-label={copy.gameModeLabel}
            className="flex w-full flex-col gap-3 border-4 border-ink bg-baize-deep p-3 shadow-hard-lg sm:mx-auto sm:w-fit sm:p-4"
        >
            <div className="grid gap-3 sm:grid-cols-[220px_minmax(300px,1fr)] sm:items-stretch sm:gap-4">
                <div ref={selector} className="relative">
                    <button
                        ref={trigger}
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={open}
                        aria-controls={listboxId}
                        onClick={() => setOpen((current) => !current)}
                        onKeyDown={handleTriggerKeyDown}
                        className={cn(
                            "flex min-h-16 w-full cursor-pointer items-center justify-between gap-3 border-[3px] border-ink bg-baize px-4 py-3 text-left shadow-hard-sm sm:h-full",
                            pressSm,
                            focusRing,
                        )}
                    >
                        <span className="min-w-0">
                            <MockLabel className="block truncate text-[9px] tracking-[.12em] text-mint/75">
                                {copy.gameModeLabel}
                            </MockLabel>
                            <span className="mt-1 block truncate font-display text-[16px] font-extrabold tracking-[-.02em] text-cream">
                                {selected.title}
                            </span>
                        </span>
                        <ChevronDown
                            aria-hidden
                            size={20}
                            strokeWidth={3}
                            className={cn(
                                "shrink-0 text-mint transition-transform motion-reduce:transition-none",
                                open && "rotate-180",
                            )}
                        />
                    </button>

                    {open ? (
                        <div
                            ref={listbox}
                            id={listboxId}
                            role="listbox"
                            tabIndex={-1}
                            aria-label={copy.gameModeLabel}
                            aria-activedescendant={`${listboxId}-${selected.id}`}
                            onKeyDown={handleListboxKeyDown}
                            className="absolute bottom-full left-0 z-40 mb-3 w-full border-4 border-ink bg-cream shadow-hard outline-none sm:w-[360px]"
                        >
                            {modes.map((mode, index) => {
                                const isSelected = index === selectedIndex;
                                return (
                                    <div
                                        key={mode.id}
                                        id={`${listboxId}-${mode.id}`}
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => selectMode(index)}
                                        className={cn(
                                            "flex w-full cursor-pointer items-center gap-3 border-ink px-4 py-3 text-left not-first:border-t-[3px]",
                                            isSelected
                                                ? "bg-rust text-cream"
                                                : "bg-cream text-ink hover:bg-paper",
                                        )}
                                    >
                                        <span className="min-w-0 flex-1">
                                            <span className="block font-display text-[16px] font-extrabold tracking-[-.02em]">
                                                {mode.title}
                                            </span>
                                            <span
                                                className={cn(
                                                    "mt-0.5 block text-[12px] font-semibold",
                                                    isSelected
                                                        ? "text-cream/85"
                                                        : "text-moss",
                                                )}
                                            >
                                                {mode.note}
                                            </span>
                                        </span>
                                        <Check
                                            aria-hidden
                                            size={19}
                                            strokeWidth={3}
                                            className={cn(
                                                "shrink-0",
                                                !isSelected && "invisible",
                                            )}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}
                </div>

                {!selected.guest && auth.user?.authProvider === "ANONYMOUS" ? (
                    <ButtonLink
                        href={signInHref}
                        tone="rust"
                        size="lg"
                        className={playClass}
                    >
                        {copy.playNow}
                    </ButtonLink>
                ) : (
                    <Button
                        tone="rust"
                        size="lg"
                        disabled={pending}
                        onClick={() => {
                            console.log("Clicked play on " + selected.title);
                        }}
                        className={cn(playClass, "disabled:cursor-wait")}
                    >
                        {copy.playNow}
                    </Button>
                )}
            </div>

            <p
                aria-live="polite"
                className="m-0 text-center text-[13px] font-semibold text-mint/75 sm:text-[14px]"
            >
                {selected.promise ?? selected.note}
            </p>

            {error ? <FormError>{error}</FormError> : null}
        </section>
    );
}
