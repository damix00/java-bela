"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { focusRing } from "@/lib/styles";

type ModalProps = {
  children: ReactNode;
  /** Accessible name for the close control. */
  closeLabel: string;
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
 * Closing always goes through `router.back()`, never local state. The modal
 * exists *because* of the URL, so unwinding history is what actually dismisses
 * it — and it means the browser back button and the close button are the same
 * gesture rather than two that can disagree.
 */
export default function Modal({ children, closeLabel, className }: ModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    // Opened imperatively, not via the `open` attribute: only `showModal()`
    // promotes the dialog to the top layer and makes the rest of the page inert.
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const close = useCallback(() => router.back(), [router]);

  return (
    <dialog
      ref={dialogRef}
      // `Esc` fires `cancel` and would otherwise close the dialog while leaving
      // the URL on the modal route, stranding the two out of step.
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      // The backdrop is part of the dialog's own box, so a click landing on the
      // element itself — rather than bubbling up from the content — is a
      // backdrop click.
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[1080px]",
        "overflow-y-auto overscroll-contain bg-transparent p-0",
        "backdrop:bg-ink/70",
        className,
      )}
    >
      {/* `relative` so the close button anchors to the content, not the
          scroll container — otherwise it drifts away on a tall form. */}
      <div className="relative">
        <button
          type="button"
          onClick={close}
          aria-label={closeLabel}
          className={cn(
            focusRing,
            "absolute top-3 right-3 z-10 cursor-pointer border-[3px] border-ink bg-cream p-1.5 text-ink",
          )}
        >
          <X size={18} strokeWidth={3} aria-hidden />
        </button>
        {children}
      </div>
    </dialog>
  );
}
