import { internalApiFetch } from "@/api/internal";
import type { BackendAuthResponse } from "@/api/types/user";

/**
 * The one network call the proxy is allowed to make: trading the refresh cookie
 * for a live session.
 *
 * It goes through `internalApiFetch` like every other server-to-server call, so
 * the internal source token and the API's base URL are configured in exactly one
 * place. That module is `server-only`, which the proxy is — Next 16 runs the
 * proxy on the Node runtime, not in a browser bundle.
 *
 * `/auth/refresh` rather than `/auth/me` because the access token is expired
 * precisely when we need to ask — a 401 from `/me` means "stale token", which is
 * not the same as "signed out". Only the refresh endpoint can tell the
 * difference, and it answers with a fresh session as a side effect.
 */

// The proxy sits in front of every navigation, so it gets a tighter budget than
// the app's other server-to-server calls: a backend that has not answered in a
// second is one the player should not be made to wait behind. A timeout lands as
// `unavailable`, which fails open.
const VERIFY_TIMEOUT_MS = 1000;

export type SessionCheck =
  /** The backend confirmed it, and handed back a rotated session to write. */
  | { state: "valid"; session: BackendAuthResponse }
  /** The backend rejected the token outright. This is a real sign-out. */
  | { state: "rejected" }
  /** Nobody could say. The caller must fail open — see `proxy.ts`. */
  | { state: "unavailable" };

export async function verifySession(
  refreshToken: string,
): Promise<SessionCheck> {
  const result = await internalApiFetch<BackendAuthResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
    signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
  });

  if (result.ok && result.data) {
    return { state: "valid", session: result.data };
  }

  if (result.status === 401) {
    return { state: "rejected" };
  }

  // Status 0 is a timeout or an unreachable backend; a 5xx or a rate limit is
  // the backend refusing to answer. None of them are evidence that the session
  // is gone.
  return { state: "unavailable" };
}
