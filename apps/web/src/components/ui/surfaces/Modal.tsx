"use client";

import { X } from "lucide-react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/ui/cn";
import { edge, focusRing, type Surface } from "@/lib/ui/styles";

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
 * The shell for an intercepted route rendered over the page beneath it.
 *
 * Native `<dialog>` + `showModal()` rather than a portal and a hand-rolled
 * focus trap: the browser already gives us the top layer, the focus trap, the
 * inert background, the `Esc` handler and the `aria-modal` semantics, and every
 * one of those is easy to get subtly wrong by hand.
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
 * The dim is a real element rather than the dialog's `::backdrop`. A
 * pseudo-element has no node to hand Motion, so animating it would mean a
 * keyframed stylesheet running alongside — two halves of one fade, in two
 * languages, kept in step by hand. A `fixed` child of a top-layer dialog covers
 * the viewport just as the backdrop does, and it animates on the same timeline
 * as the panel. It stays `pointer-events-none` so a click out there still lands
 * on the dialog itself, which is how the dismiss below recognises it.
 *
 * Which is also why there is no `AnimatePresence` here. The panel is unmounted
 * by a *navigation*, and by the time React hears about it the route is already
 * gone — nothing is left to hold in the tree and play out. So the exit runs
 * first and the navigation second: `close()` plays the animation, awaits it,
 * and only then unwinds history.
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
    const [dimScope, animateDim] = useAnimate<HTMLDivElement>();
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

        if (!reduceMotion) {
            // The dim leaves with the panel, on the one timeline.
            await Promise.all([
                animate(
                    scope.current,
                    { opacity: 0, scale: 0.97, y: 8 },
                    { duration: 0.14, ease: "easeIn" },
                ),
                animateDim(
                    dimScope.current,
                    { opacity: 0 },
                    { duration: 0.14, ease: "easeIn" },
                ),
            ]);
        }

        if (onClose) {
            onClose();
            return;
        }

        router.back();
    }, [animate, animateDim, dimScope, onClose, reduceMotion, router, scope]);

    return (
        <dialog
            ref={dialogRef}
            // `Esc` fires `cancel` and would otherwise close the dialog while leaving
            // the URL on the modal route, stranding the two out of step.
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
                "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[1080px]",
                "overflow-y-auto overscroll-contain bg-transparent p-0",
                "backdrop:bg-transparent",
                className,
            )}
        >
            {/* The dim itself is what makes the dialog read as modal, so under
          reduced motion it is simply there from the first frame — only the
          fade goes. */}
            <motion.div
                ref={dimScope}
                aria-hidden
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="pointer-events-none fixed inset-0 bg-ink/70"
            />
            {/* `relative` so the close button anchors to the content, not the
          scroll container — otherwise it drifts away on a tall form.

          The panel rises a little as it fades in rather than only fading: the
          blocks on this page are physical, and one that materialises in place
          reads as a texture change instead of a thing arriving. */}
            <motion.div
                ref={scope}
                initial={
                    reduceMotion ? false : { opacity: 0, scale: 0.96, y: 14 }
                }
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
            >
                {dismissible && (
                    <button
                        type="button"
                        onClick={() => void close()}
                        aria-label={closeLabel}
                        className={cn(
                            focusRing,
                            "absolute top-3 right-3 z-10 cursor-pointer p-1.5",
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
