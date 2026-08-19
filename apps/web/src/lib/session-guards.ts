import { redirect } from "next/navigation";

import { getCurrentUser } from "@/actions/auth";
import { isGuest, type User } from "@/api/types/user";
import type { Locale } from "@/lib/i18n";
import { homePath } from "@/lib/routes";

/**
 * The guard every credential screen runs before it renders.
 *
 * A player with a real account has nothing to do on a screen whose whole job is
 * to hand out a session they already hold, so they go to the lobby instead. A
 * guest does not: an anonymous account is exactly the person who has a reason
 * to sign in or to register, and sending them away would strand them in the
 * throwaway account they started with.
 *
 * The returned user is what the sign-in screen reads to decide whether to offer
 * guest play at all — `null` means signed out, and only then is it an offer
 * rather than a loop back to what they already are.
 *
 * Not for `welcome` or `username`: those are the tail of a flow that has
 * already produced a session, and are reached *because* you are signed in.
 */
export async function guardCredentialScreen(
  locale: Locale,
  returnTo?: string | null,
): Promise<User | null> {
  const user = await getCurrentUser();

  if (user && !isGuest(user)) {
    // `returnTo` is where the proxy was sending them before it found no session.
    // Someone who turns out to have one after all belongs at that destination,
    // not at the lobby — otherwise a stale tab that redirects here loses the
    // table it was trying to rejoin.
    redirect(returnTo ?? homePath(locale));
  }

  return user;
}
