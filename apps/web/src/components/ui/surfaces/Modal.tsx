"use client";

import { X } from "lucide-react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/ui/cn";
import {
    edge,
    focusRing,
    POP_OUT_MS,
    popEnterFrom,
    popEnterTo,
    popExitTo,
    popTransition,
    type Surface,
} from "@/lib/ui/styles";

type ModalProps = {
    children: ReactNode;
    /** Accessible name for the close control. Unused when `dismissible` is false. */
    closeLabel: string;
    /**
     * Whether the player can wave the dialog away. False makes it a gate: no
     * close button, `Esc` does nothing, and a backdrop click does nothing. The
     * way out is through the dialog's own controls.
     */
    dismissible?: boolean;
    /**
     * Where closing goes. Omitted, the dialog unwinds history, which is what an
     * intercepted route needs — see below. Supplied, it is called instead, for
     * a dialog that some component opened from its own state and has to close
     * the same way.
     */
    onClose?: () => void;
    /**
     * Which language the shell's own furniture is drawn in. The panel inside is
     * whatever the caller puts there; this is only the close button, which is
     * the one thing the shell draws itself.
     */
    surface?: Surface;
    className?: string;
};

/**
 * The shell every dialog in the app is put over the page with.
 *
 * Native `<dialog>` + `showModal()` rather than a portal and a hand-rolled
 * focus trap: the browser already gives us the top layer, the focus trap, the
 * inert background, the `Esc` handler and the `aria-modal` semantics, and every
 * one of those is easy to get subtly wrong by hand. The game route used to
 * prove that twice over — two dialogs on the felt with a hand-drawn scrim, one
 * with an `Esc` listener and no focus trap and one with neither.
 *
 * A gate (`dismissible={false}`) keeps all of that — the top layer, the focus
 * trap, the inert page — and only removes the ways out that aren't a decision:
 * the close button, `Esc`, and the backdrop. The browser's own Back still
 * works, because history is not something a page should be able to take away.
 *
 * Closing goes through `router.back()` by default, never local state. A modal
 * that exists *because* of the URL is dismissed by unwinding history — and that
 * way the browser back button and the close button are the same gesture rather
 * than two that can disagree. A dialog opened from component state has no such
 * history entry to unwind and passes `onClose` instead.
 *
 * The dim is the real `::backdrop`, faded by CSS in `globals.css`, while the
 * panel is animated by Motion. Two languages for one entrance is a cost, and it
 * bought a fix: the dim used to be a `fixed` child of this dialog so Motion
 * could have a node for it, and Chromium composites a fixed child of a
 * top-layer element on its own layer that it does not merge until the next full
 * paint — so the dim snapped in at the end of the panel's entrance rather than
 * fading with it, and clipped square at the corners on the way. `POP_OUT_MS`
 * is what holds the two halves together on the way out.
 *
 * The scroll lives on the panel rather than on the dialog for the same reason:
 * a top-layer element that is also a scroll container is the other half of that
 * compositing problem, and nothing here needs the dialog itself to scroll.
 *
 * Which is also why there is no `AnimatePresence`. The panel is unmounted by a
 * *navigation*, and by the time React hears about it the route is already gone
 * — nothing is left to hold in the tree and play out. So the exit runs first
 * and the navigation second: `close()` plays the animation, awaits it, and only
 * then unwinds history.
 */
export default function Modal({
    children,
    closeLabel,
    dismissible = true,
    onClose,
    surface = "brut",
    className,
}: ModalProps) {
    const router = useRouter();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [scope, animate] = useAnimate<HTMLDivElement>();
    const reduceMotion = useReducedMotion();
    // A modal can be dismissed twice in the time the exit takes to play — `Esc`
    // on the way to a backdrop click. Two `router.back()` calls unwind two
    // entries, which would throw the player a screen further back than they
    // asked to go.
    const closing = useRef(false);

    useEffect(() => {
        const dialog = dialogRef.current;
        // Opened imperatively, not via the `open` attribute: only `showModal()`
        // promotes the dialog to the top layer and makes the rest of the page inert.
        if (dialog && !dialog.open) dialog.showModal();
    }, []);

    // A gate has to hold `Esc` shut, and the `cancel` event alone doesn't do it.
    // Chrome routes the key through a close watcher whose `cancel` is only
    // cancellable when the page has been interacted with, so a dialog opened for
    // the player — as this one is, a beat after the table lands — can be escaped
    // once for free. Swallowing the key before the watcher sees it closes that
    // hole, and re-showing on `close` covers anything that still gets through.
    useEffect(() => {
        if (dismissible) return;
        const dialog = dialogRef.current;
        if (!dialog) return;

        const swallowEscape = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
        };
        const reopen = () => {
            if (!dialog.open) dialog.showModal();
        };

        dialog.addEventListener("keydown", swallowEscape, { capture: true });
        document.addEventListener("keydown", swallowEscape, { capture: true });
        dialog.addEventListener("close", reopen);

        return () => {
            dialog.removeEventListener("keydown", swallowEscape, {
                capture: true,
            });
            document.removeEventListener("keydown", swallowEscape, {
                capture: true,
            });
            dialog.removeEventListener("close", reopen);
        };
    }, [dismissible]);

    const close = useCallback(async () => {
        if (closing.current) return;
        closing.current = true;

        // Set before the await, not after: this is what starts the dim's own
        // fade, and it has to leave alongside the panel rather than behind it.
        dialogRef.current?.setAttribute("data-closing", "true");

        if (!reduceMotion) {
            await Promise.all([
                animate(scope.current, popExitTo, {
                    duration: POP_OUT_MS / 1000,
                    ease: "easeIn",
                }),
                // The dim is CSS, so there is no animation object to await —
                // only the duration it was given.
                new Promise((resolve) => setTimeout(resolve, POP_OUT_MS)),
            ]);
        }

        if (onClose) {
            onClose();
            return;
        }

        router.back();
    }, [animate, onClose, reduceMotion, router, scope]);

    return (
        <dialog
            ref={dialogRef}
            onCancel={(event) => {
                // Always prevented: `Esc` would otherwise close the dialog and leave
                // the URL on the modal route, stranding the two out of step. On a gate
                // that is the whole handling — the key does nothing at all.
                event.preventDefault();
                if (dismissible) void close();
            }}
            // The backdrop is part of the dialog's own box, so a click landing on the
            // element itself — rather than bubbling up from the content — is a
            // backdrop click.
            onClick={(event) => {
                if (!dismissible) return;
                if (event.target === dialogRef.current) void close();
            }}
            className={cn(
                // `modal-shell` is what the `::backdrop` rules in `globals.css`
                // hang off. Without it the dialog has no dim at all.
                "modal-shell m-auto w-[calc(100vw-2rem)] max-w-[1080px] bg-transparent p-0",
                className,
            )}
        >
            {/* `relative` so the close button anchors to the content, not the
                page — otherwise it drifts away on a tall form. The scroll is
                here rather than on the dialog: see the note above.

                The panel rises a little as it fades in rather than only fading:
                the blocks on this page are physical, and one that materialises
                in place reads as a texture change instead of a thing arriving.

                The padding is what a scroll container costs. `overflow-y-auto`
                clips at this box, and everything a panel paints *outside* its
                border box — its drop shadow, the rust ring the accented card
                wears — was drawn straight through it. Since the clip is square
                and the panel is not, the only part that survived was the wedge
                in each corner: four rust commas on the sign-up card, four dark
                ones everywhere else, none of which read as anything but dirt on
                the screen. Padding gives the shadow somewhere to land inside
                the clip: 4px is the ring plus the 2px the blur reaches sideways,
                and the bottom takes 8px because the shadow is thrown downwards.
                The close button's offsets carry the same 4px, so it still sits
                12px in from the panel's own corner. */}
            <motion.div
                ref={scope}
                initial={reduceMotion ? false : popEnterFrom}
                animate={popEnterTo}
                transition={reduceMotion ? { duration: 0 } : popTransition}
                className="relative max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain px-1 pt-1 pb-2"
            >
                {dismissible && (
                    <button
                        type="button"
                        onClick={() => void close()}
                        aria-label={closeLabel}
                        className={cn(
                            focusRing,
                            "absolute top-4 right-4 z-10 cursor-pointer p-1.5",
                            surface === "felt"
                                ? `rounded-full bg-baize-deep text-mint hover:text-cream ${edge}`
                                : "border-[3px] border-ink bg-cream text-ink",
                        )}
                    >
                        <X size={18} strokeWidth={3} aria-hidden />
                    </button>
                )}
                {children}
            </motion.div>
        </dialog>
    );
}
