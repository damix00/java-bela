"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type AuthGateProps = {
  /** The auth route to open. Its intercepted twin is what actually renders. */
  href: string;
  delayMs?: number;
};

/**
 * Opens the sign-in form over the table a beat after the page lands.
 *
 * A `router.push`, not local state, because the modal on this site is a *route*
 * — pushing is what the intercepted `@modal/(.)sign-in` segment is waiting for,
 * and it means the auto-opened form behaves like a clicked one: same panel,
 * shareable URL, closes on back.
 *
 * The beat is deliberate. Landing straight into a dialog gives a first-time
 * visitor no idea what they are being asked to sign in *to*; a second of the
 * table first is the pitch, and the form is the ask.
 *
 * It fires once and never again. The push changes the pathname, and this
 * component stays mounted underneath the modal it opened, so anything watching
 * the route here would re-arm the timer and shove the player back into the form
 * every second after they dismissed it.
 */
export default function AuthGate({ href, delayMs = 1000 }: AuthGateProps) {
  const router = useRouter();
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current) return;

    // Warmed up front, so the pause is the one we chose rather than ours plus a
    // round trip for the form.
    router.prefetch(href);

    const timer = setTimeout(() => {
      opened.current = true;
      // The table is worth looking at — don't yank the page to the top on the
      // way into the dialog.
      router.push(href, { scroll: false });
    }, delayMs);

    return () => clearTimeout(timer);
  }, [router, href, delayMs]);

  return null;
}
