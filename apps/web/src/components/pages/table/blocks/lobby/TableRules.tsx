"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MatchType } from "@bela/protocol";

import RankedGate from "@/components/pages/table/blocks/lobby/RankedGate";
import MockLabel from "@/components/pages/table/blocks/shared/MockLabel";
import {
    PRIVATE_TARGET_SCORE,
    PRIVATE_TARGET_SCORES,
    useLobby,
    useLobbyActions,
} from "@/context/lobby-context";
import type { Dictionary } from "@/dictionaries";
import { cn } from "@/lib/ui/cn";
import { focusRing, pressSm } from "@/lib/ui/styles";

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
 * How long a private table plays for, as four lengths side by side.
 *
 * It lives inside the Private row of the rules menu rather than beside it: the
 * score is not a second setting, it is the rest of the sentence that row starts
 * — and a table only has a length to choose once it is private.
 *
 * Flat, unlike nearly every other button on this screen. The menu it sits in is
 * already a raised block, and four more shadowed blocks inside it read as a
 * second layer stacked on the first; the fill carries the state instead.
 *
 * Both handlers stop propagation. The row underneath is a listbox option that
 * commits on click, and the list itself commits on Enter and Space — without
 * this, choosing 701 would also re-select the row it is standing on.
 */
function TargetScorePicker({
    label,
    target,
    onSelect,
}: {
    label: string;
    target: number;
    onSelect: (points: number) => void;
}) {
    return (
        <span role="group" aria-label={label} className="mt-2.5 flex gap-2">
            {PRIVATE_TARGET_SCORES.map((points) => {
                const current = points === target;

                return (
                    <button
                        key={points}
                        type="button"
                        aria-pressed={current}
                        onClick={(event) => {
                            event.stopPropagation();
                            onSelect(points);
                        }}
                        onKeyDown={(event) => event.stopPropagation()}
                        className={cn(
                            "min-w-14 cursor-pointer border-[3px] border-ink px-2.5 py-1.5 text-center font-display text-[13px] font-extrabold tracking-[-.01em]",
                            // Not the shared `focusRing`: that one is rust, and
                            // these are the only controls on the screen sitting
                            // *on* rust — the selected row they belong to. It
                            // would be a ring the same colour as the ground
                            // behind it, which for a keyboard-only control is
                            // the whole of the affordance.
                            "focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-cream",
                            current
                                ? "bg-ink text-cream"
                                : "bg-cream text-ink hover:bg-paper",
                        )}
                    >
                        {points}
                    </button>
                );
            })}
        </span>
    );
}

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
    const { lobby, isHost } = useLobby();
    const { setMatchType } = useLobbyActions();

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

    /**
     * What the table is playing to, straight from the lobby.
     *
     * Ranked and casual carry their own fixed score in the same field, so this
     * is only ever shown for a private table; the fallback covers the frames
     * before the first snapshot lands.
     */
    const targetScore =
        lobby?.gameConfiguration?.targetScore ?? PRIVATE_TARGET_SCORE;

    const rules = useMemo(
        () => [
            // Ranked is out of the picker until there is a rating behind it.
            // Nothing else about it is removed — the copy, the guest gate and
            // the backend's `MatchType.RANKED` all stand — so putting the row
            // back is uncommenting it.
            // {
            //     type: MatchType.RANKED,
            //     title: copy.rules.ranked.title,
            //     note: copy.rules.ranked.note,
            //     guest: false,
            // },
            {
                type: MatchType.CASUAL,
                title: copy.rules.casual.title,
                note: copy.rules.casual.note,
                guest: true,
            },
            {
                type: MatchType.PRIVATE,
                title: copy.rules.private.title,
                note: copy.rules.private.note.replace(
                    "{score}",
                    String(targetScore),
                ),
                guest: true,
            },
        ],
        [copy, targetScore],
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
    const isPrivate = selected.type === MatchType.PRIVATE;

    /** Just the length, for the closed control. The menu says the rest. */
    const scoreLabel = copy.rules.private.score.replace(
        "{score}",
        String(targetScore),
    );

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

        // Re-picking Private keeps the score the host already set — the row is
        // still selectable while it is the current rule, and a re-pick that
        // quietly reset 1001 to the default would be a change nobody asked for.
        // Arriving at Private from another rule starts at the default.
        setMatchType(
            rule.type,
            rule.type === MatchType.PRIVATE && isPrivate
                ? targetScore
                : undefined,
        );
        closeListbox();
    }

    /** Choosing a length for a private table. Same command, points and all. */
    function selectPoints(points: number) {
        setMatchType(MatchType.PRIVATE, points);
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
            // Forwards into a private table's score buttons, which are the next
            // focusable things inside the open list — closing here would
            // unmount the control on the way to it. Everything else tabs out,
            // and whatever focus lands on next, the blur handler on the
            // wrapper closes the list behind it.
            if (showPoints && !event.shiftKey) return;

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

    // The scores live in the open menu, on the row they belong to, and only
    // while that row is the table's current rule. A private table is the only
    // one whose length is the host's to set, and offering the buttons before
    // Private is chosen would be offering a setting for a table that isn't.
    const showPoints = open && isPrivate;

    const face = (
        <span className="min-w-0 text-left">
            <MockLabel className="block truncate text-[9px] tracking-[.12em] text-mint/75">
                {copy.rulesLabel}
            </MockLabel>
            {/* On the same line as the rule, in the same face, because it is
                the same fact: what this table is. It was a subtitle first, and
                a subtitle is where it went to hide — small, dimmed, and cut off
                by the width of the block before it reached the end of its own
                sentence. The score is the only part of that sentence anyone
                needs from the closed control, so it is the only part kept.

                Ranked and casual don't get it. Theirs is fixed, named in the
                menu, and would be a line that never changes. */}
            <span className="mt-0.5 block truncate font-display text-[16px] font-extrabold tracking-[-.02em] text-cream">
                {selected.title}
                {isPrivate && (
                    <span className="text-mint"> · {scoreLabel}</span>
                )}
            </span>
        </span>
    );

    // A guest at someone else's table has no control to offer, so it isn't
    // drawn as one. Same block, same place, no affordance.
    if (!isHost) {
        return (
            <div className="flex min-h-14 portrait-sm:min-h-12 w-full items-center border-[3px] border-ink bg-baize px-4 py-3 desk:min-h-16">
                {face}
            </div>
        );
    }

    return (
        <div
            ref={selector}
            className="relative"
            /**
             * Focus leaving the control closes it.
             *
             * The listbox used to be the only focusable thing inside it, so
             * handling Tab there was enough. A private table's score buttons
             * are focusable too, and tabbing off the last of them would
             * otherwise leave the menu standing open behind whatever the player
             * moved on to. React's `onBlur` is `focusout`, so it reaches here
             * from any of them; `relatedTarget` says where focus went, and a
             * move *within* the control — into a button, or back to the trigger
             * as `closeListbox` restores it — is not a departure.
             */
            onBlur={(event) => {
                if (!open) return;

                const next = event.relatedTarget as Node | null;
                if (next && selector.current?.contains(next)) return;

                setOpen(false);
                setActiveIndex(null);
            }}
        >
            <button
                ref={trigger}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listboxId}
                onClick={() => (open ? closeListbox() : openListbox())}
                onKeyDown={handleTriggerKeyDown}
                className={cn(
                    "flex min-h-14 portrait-sm:min-h-12 w-full cursor-pointer items-center justify-between gap-3 border-[3px] border-ink bg-baize px-4 py-3 text-left shadow-hard-sm desk:min-h-16",
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

                                    {showPoints &&
                                        rule.type === MatchType.PRIVATE && (
                                            <TargetScorePicker
                                                label={
                                                    copy.rules.private
                                                        .pointsLabel
                                                }
                                                target={targetScore}
                                                onSelect={selectPoints}
                                            />
                                        )}
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
