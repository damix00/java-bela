"use client";

import { Check, ChevronDown } from "lucide-react";
import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from "react";

import { loginAnonymous } from "@/actions/auth";
import { Button } from "@/components/controls/Button";
import FormError from "@/components/controls/FormError";
import MockLabel from "@/components/pages/table/blocks/MockLabel";
import RankedGate from "@/components/pages/table/blocks/RankedGate";
import { useAuthSubmit } from "@/components/pages/auth/useAuthSubmit";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import {
    getLastGameMode,
    getServerLastGameMode,
    setLastGameMode,
    subscribeLastGameMode,
} from "@/lib/last-game-mode";
import { focusRing, pressSm } from "@/lib/styles";

type PlayModesProps = {
    copy: Dictionary["table"];
    errors: Dictionary["form"]["errors"];
    locale: Locale;
    /** Where the ranked gate sends a guest — see `RankedGate`. */
    signUpHref: string;
    /**
     * Whether this player is on an anonymous account.
     *
     * Read on the server and handed down rather than pulled from `useAuth`
     * here: the token store is seeded in an effect, so during hydration the
     * context still says "signed out" and this component would render its
     * signed-in half one pass later than the HTML did. As a prop it is the same
     * value on both passes.
     */
    guest: boolean;
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
 * button beside it plays that choice. Ranked is selected on arrival because it
 * is what the site is for — except for a guest, who opens on casual, the best
 * mode they can actually start.
 *
 * A guest can play everything except ranked, so three of the four start on the
 * spot. Ranked is the one that asks for an account first, because a rating has
 * to belong to someone who will still exist tomorrow.
 *
 * That refusal happens when the mode is *chosen*, not when play is pressed —
 * `RankedGate` explains it and offers the way through. Refusing at the play
 * button instead left ranked looking available right up until it wasn't, and
 * sprung the news after the player had committed to starting a game. Choosing
 * is also the only moment they are already reaching for what an account is for,
 * which makes it the one place the case is worth making.
 */
export default function PlayModes({
    copy,
    errors,
    locale,
    signUpHref,
    guest,
}: PlayModesProps) {
    const { submit, pending, error } = useAuthSubmit(locale, errors);
    const [open, setOpen] = useState(false);
    // Which option the keyboard is on while the list is open, as distinct from
    // the one that has been chosen. They used to be the same value, which meant
    // arrowing over an option chose it — survivable when choosing was free, and
    // not once landing on ranked as a guest raises a dialog. Null while closed.
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    /** Set when a guest picks a mode their account can't start. */
    const [gateOpen, setGateOpen] = useState(false);
    const listboxId = useId();
    const selector = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const listbox = useRef<HTMLDivElement>(null);

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
        ],
        [copy],
    );

    // What this browser chose last time, or null on a first visit and during
    // hydration. Not state of ours — the store owns it, and a selection made in
    // another tab moves this one too.
    const stored = useSyncExternalStore(
        subscribeLastGameMode,
        getLastGameMode,
        getServerLastGameMode,
    );
    const storedMode = modes.find((mode) => mode.id === stored);

    // Unknown ids are dropped — the mode list changes between releases and the
    // value is editable by hand. A stored `ranked` is dropped for a guest too:
    // restoring it would land them back on the one mode this account cannot
    // start, which is the friction remembering the choice is meant to remove.
    //
    // Failing that: a guest opens on casual, everyone else on ranked. Arriving
    // with the one mode selected that this account cannot press makes the first
    // thing on the screen a locked door; ranked is still one click away, and the
    // case for an account is waiting there when they make that click.
    const selectedId =
        storedMode && !(guest && !storedMode.guest)
            ? storedMode.id
            : guest
              ? "casual"
              : "ranked";

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
                // Not `closeListbox`: that pulls focus back to the trigger, which
                // would snatch it from whatever the player just clicked.
                setOpen(false);
                setActiveIndex(null);
            }
        };

        document.addEventListener("pointerdown", closeOnOutsidePress);
        return () =>
            document.removeEventListener("pointerdown", closeOnOutsidePress);
    }, [open]);

    function openListbox() {
        setActiveIndex(selectedIndex);
        setOpen(true);
    }

    function closeListbox({ restoreFocus = true } = {}) {
        setOpen(false);
        setActiveIndex(null);
        if (restoreFocus) trigger.current?.focus();
    }

    /**
     * Committing to a mode: a write to the store and nothing else — there is no
     * local copy of the selection to keep in step, which is the point of holding
     * it there.
     *
     * Unless the account can't have it. A guest picking ranked gets the dialog
     * and keeps the mode they were on: the selection is left alone precisely
     * because the answer was no, and quietly switching to ranked anyway would
     * strand them on an unstartable mode the moment they dismiss it.
     */
    function selectMode(index: number) {
        const mode = modes[index]!;

        if (guest && !mode.guest) {
            setGateOpen(true);
            closeListbox();
            return;
        }

        setLastGameMode(mode.id);
        closeListbox();
    }

    function handleTriggerKeyDown(event: React.KeyboardEvent) {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

        event.preventDefault();
        openListbox();
    }

    function handleListboxKeyDown(event: React.KeyboardEvent) {
        let next: number | null = null;

        if (event.key === "ArrowDown") {
            next = (activeOption + 1) % modes.length;
        } else if (event.key === "ArrowUp") {
            next = (activeOption - 1 + modes.length) % modes.length;
        } else if (event.key === "Home") {
            next = 0;
        } else if (event.key === "End") {
            next = modes.length - 1;
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectMode(activeOption);
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
        setActiveIndex(next);
    }

    // While the list is closed there is no active option, and the chosen one
    // stands in — that is what the trigger and the first arrow key start from.
    const activeOption = activeIndex ?? selectedIndex;

    const playClass =
        "h-full min-h-[68px] w-full py-4 text-center text-[19px] tracking-[-.02em] sm:text-[21px]";

    return (
        <section
            aria-label={copy.gameModeLabel}
            className="flex w-full flex-col gap-3 border-4 border-ink bg-baize-deep p-3 shadow-hard-lg sm:mx-auto sm:w-fit sm:p-4">
            <div className="grid gap-3 sm:grid-cols-[220px_minmax(300px,1fr)] sm:items-stretch sm:gap-4">
                <div ref={selector} className="relative">
                    <button
                        ref={trigger}
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={open}
                        aria-controls={listboxId}
                        onClick={() => (open ? closeListbox() : openListbox())}
                        onKeyDown={handleTriggerKeyDown}
                        className={cn(
                            "flex min-h-16 w-full cursor-pointer items-center justify-between gap-3 border-[3px] border-ink bg-baize px-4 py-3 text-left shadow-hard-sm sm:h-full",
                            pressSm,
                            focusRing,
                        )}>
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
                            aria-activedescendant={`${listboxId}-${modes[activeOption]!.id}`}
                            onKeyDown={handleListboxKeyDown}
                            className="absolute bottom-full left-0 z-40 mb-3 w-full border-4 border-ink bg-cream shadow-hard outline-none sm:w-[360px]">
                            {modes.map((mode, index) => {
                                const isSelected = index === selectedIndex;
                                // The fill follows the keyboard; the tick marks
                                // what is actually chosen. They part company only
                                // while someone is arrowing through the list.
                                const isActive = index === activeOption;
                                return (
                                    <div
                                        key={mode.id}
                                        id={`${listboxId}-${mode.id}`}
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => selectMode(index)}
                                        className={cn(
                                            "flex w-full cursor-pointer items-center gap-3 border-ink px-4 py-3 text-left not-first:border-t-[3px]",
                                            isActive
                                                ? "bg-rust text-cream"
                                                : "bg-cream text-ink hover:bg-paper",
                                        )}>
                                        <span className="min-w-0 flex-1">
                                            <span className="block font-display text-[16px] font-extrabold tracking-[-.02em]">
                                                {mode.title}
                                            </span>
                                            <span
                                                className={cn(
                                                    "mt-0.5 block text-[12px] font-semibold",
                                                    isActive
                                                        ? "text-cream/85"
                                                        : "text-moss",
                                                )}>
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

                {/* Always the play button now. The refusal moved to the moment
                    of choosing — a guest cannot hold ranked long enough to press
                    this, so there is no second state for it to be in. */}
                <Button
                    tone="rust"
                    size="lg"
                    disabled={pending}
                    onClick={() => {
                        console.log("Clicked play on " + selected.title);
                    }}
                    className={cn(playClass, "disabled:cursor-wait")}>
                    {copy.playNow}
                </Button>
            </div>

            <p
                aria-live="polite"
                className="m-0 text-center text-[13px] font-semibold text-mint/75 sm:text-[14px]">
                {selected.promise ?? selected.note}
            </p>

            {error ? <FormError>{error}</FormError> : null}

            {gateOpen && (
                <RankedGate
                    copy={copy.guestRanked}
                    closeLabel={copy.guestRanked.dismiss}
                    href={signUpHref}
                    onClose={() => {
                        setGateOpen(false);
                        // Back to the control that raised it, not to the top of
                        // the document — the dialog was an answer to a click.
                        trigger.current?.focus();
                    }}
                />
            )}
        </section>
    );
}
