"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MatchType } from "@bela/protocol";

import MockLabel from "@/components/pages/table/blocks/MockLabel";
import RankedGate from "@/components/pages/table/blocks/RankedGate";
import { useLobby } from "@/context/lobby-context";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/cn";
import { focusRing, pressSm } from "@/lib/styles";

type TableRulesProps = {
    copy: Dictionary["table"];
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
 * What this table is playing for.
 *
 * It sets the lobby's configuration and nothing else — the backend's
 * `lobby:changeConfig` swaps the match type and the target score that comes
 * with it, and everyone at the table is told. It does not start anything, and
 * it does not choose an opponent: there is no matchmaker behind ranked yet, so
 * a ranked table here is a ranked game among the four people you invited.
 *
 * **Only the host can change it.** `LobbyService.updateConfig` enforces that
 * and answers anyone else with `PlayerNotHostException`, so offering the
 * control to a guest at the table would be offering a refusal. They see the
 * rule the host picked, in the same place, as plain text.
 *
 * A guest account still cannot hold ranked. A rating has to belong to someone
 * who will still exist tomorrow, and an anonymous account is deleted a day
 * after it is made. That refusal happens when the rule is *chosen*, not
 * afterwards — `RankedGate` explains it and offers the way through. Choosing is
 * also the only moment they are already reaching for what an account is for,
 * which makes it the one place the case is worth making.
 */
export default function TableRules({
    copy,
    signUpHref,
    guest,
}: TableRulesProps) {
    const { lobby, isHost, setMatchType } = useLobby();

    const [open, setOpen] = useState(false);
    // Which option the keyboard is on while the list is open, as distinct from
    // the one that has been chosen. They used to be the same value, which meant
    // arrowing over an option chose it — survivable when choosing was free, and
    // not once landing on ranked as a guest raises a dialog. Null while closed.
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    /** Set when a guest picks a rule their account can't hold. */
    const [gateOpen, setGateOpen] = useState(false);
    const listboxId = useId();
    const selector = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const listbox = useRef<HTMLDivElement>(null);

    const rules = useMemo(
        () => [
            {
                type: MatchType.RANKED,
                title: copy.rules.ranked.title,
                note: copy.rules.ranked.note,
                guest: false,
            },
            {
                type: MatchType.CASUAL,
                title: copy.rules.casual.title,
                note: copy.rules.casual.note,
                guest: true,
            },
            {
                type: MatchType.PRIVATE,
                title: copy.rules.private.title,
                note: copy.rules.private.note,
                guest: true,
            },
        ],
        [copy],
    );

    // The lobby is the source of truth, not a local copy of it: the host's own
    // change comes back as `lobby:configChanged` like everyone else's, so there
    // is no second value here to drift out of step.
    const selectedIndex = Math.max(
        rules.findIndex(
            (rule) => rule.type === lobby?.gameConfiguration?.matchType,
        ),
        0,
    );
    const selected = rules[selectedIndex]!;

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
     * Committing to a rule: one command to the backend and nothing else — the
     * new configuration arrives back as an event, which is what moves the
     * control.
     *
     * Unless the account can't hold it. A guest picking ranked gets the dialog
     * and the table keeps the rule it had: nothing is sent precisely because the
     * answer was no.
     */
    function selectRule(index: number) {
        const rule = rules[index]!;

        if (guest && !rule.guest) {
            setGateOpen(true);
            closeListbox();
            return;
        }

        setMatchType(rule.type);
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
            next = (activeOption + 1) % rules.length;
        } else if (event.key === "ArrowUp") {
            next = (activeOption - 1 + rules.length) % rules.length;
        } else if (event.key === "Home") {
            next = 0;
        } else if (event.key === "End") {
            next = rules.length - 1;
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectRule(activeOption);
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

    const face = (
        <span className="min-w-0 text-left">
            <MockLabel className="block truncate text-[9px] tracking-[.12em] text-mint/75">
                {copy.rulesLabel}
            </MockLabel>
            <span className="mt-0.5 block truncate font-display text-[16px] font-extrabold tracking-[-.02em] text-cream">
                {selected.title}
            </span>
        </span>
    );

    // A guest at someone else's table has no control to offer, so it isn't
    // drawn as one. Same block, same place, no affordance.
    if (!isHost) {
        return (
            <div className="flex min-h-16 w-full items-center border-[3px] border-ink bg-baize px-4 py-3">
                {face}
            </div>
        );
    }

    return (
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
                    "flex min-h-16 w-full cursor-pointer items-center justify-between gap-3 border-[3px] border-ink bg-baize px-4 py-3 text-left shadow-hard-sm",
                    pressSm,
                    focusRing,
                )}
            >
                {face}
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
                    aria-label={copy.rulesLabel}
                    aria-activedescendant={`${listboxId}-${rules[activeOption]!.type}`}
                    onKeyDown={handleListboxKeyDown}
                    className="absolute bottom-full left-0 z-40 mb-3 w-full border-4 border-ink bg-cream shadow-hard outline-none sm:w-[360px]"
                >
                    {rules.map((rule, index) => {
                        const isSelected = index === selectedIndex;
                        // The fill follows the keyboard; the tick marks what is
                        // actually chosen. They part company only while someone
                        // is arrowing through the list.
                        const isActive = index === activeOption;
                        return (
                            <div
                                key={rule.type}
                                id={`${listboxId}-${rule.type}`}
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => selectRule(index)}
                                className={cn(
                                    "flex w-full cursor-pointer items-center gap-3 border-ink px-4 py-3 text-left not-first:border-t-[3px]",
                                    isActive
                                        ? "bg-rust text-cream"
                                        : "bg-cream text-ink hover:bg-paper",
                                )}
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="block font-display text-[16px] font-extrabold tracking-[-.02em]">
                                        {rule.title}
                                    </span>
                                    <span
                                        className={cn(
                                            "mt-0.5 block text-[12px] font-semibold",
                                            isActive
                                                ? "text-cream/85"
                                                : "text-moss",
                                        )}
                                    >
                                        {rule.note}
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
        </div>
    );
}
