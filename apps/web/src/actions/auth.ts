"use server";

import { cookies } from "next/headers";

import { internalApiFetch } from "@/api/internal";
import type { AuthResponse, BackendAuthResponse, User } from "@/api/types/user";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_COOKIE,
  accessTokenExpiryMs,
  clearSessionCookies,
  setSessionCookies,
} from "@/actions/cookies";

export type AuthActionResult =
  | { ok: true; auth: AuthResponse }
  | { ok: false; error: string; code?: string };

/**
 * Every credential exchange goes through the Next server: the refresh token has
 * to become an httpOnly cookie on *this* origin, which a cross-origin
 * Set-Cookie from the backend cannot do. Nothing here ever returns the refresh
 * token to the caller.
 */
async function authenticate(
  endpoint: string,
  body?: unknown,
): Promise<AuthActionResult> {
  const result = await internalApiFetch<BackendAuthResponse>(endpoint, {
    method: "POST",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!result.ok || !result.data) {
    return {
      ok: false,
      // The backend's message is the specific one ("Email already exists"); the
      // caller falls back to localised copy when there isn't one.
      error: result.error?.message ?? "",
      code: result.status === 0 ? "NETWORK" : result.error?.code,
    };
  }

  const cookieStore = await cookies();
  setSessionCookies(cookieStore, result.data);

  return {
    ok: true,
    auth: {
      accessToken: result.data.accessToken,
      expiresIn: result.data.expiresIn,
      user: result.data.user,
    },
  };
}

export async function login(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  return authenticate("/auth/login", { email, password });
}

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<AuthActionResult> {
  return authenticate("/auth/register", { username, email, password });
}

export async function loginAnonymous(): Promise<AuthActionResult> {
  return authenticate("/auth/login/anonymous");
}

export async function logout() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    // Deliberately not awaited for its result: a backend outage must not leave
    // the player stuck logged in locally.
    await internalApiFetch("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null);
  }

  clearSessionCookies(cookieStore);
}

/**
 * Reads the session for server rendering. Presence of the refresh cookie is what
 * counts — the access token may well be expired, and that is not the same as
 * being logged out.
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();

  if (!cookieStore.get(REFRESH_TOKEN_COOKIE)?.value) {
    return null;
  }

  const user = cookieStore.get(USER_COOKIE)?.value;
  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user) as User;
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

/**
 * Seeds the client auth store on a full page load. The access token is only
 * handed over if it is still fresh; otherwise the client bootstraps itself
 * through /api/auth/refresh, since a Server Component cannot set cookies and so
 * cannot refresh anything itself.
 */
export async function getInitialSession(): Promise<{
  user: User | null;
  token: string | null;
  expiresAt: number;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, token: null, expiresAt: 0 };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  const expiresAt = token ? accessTokenExpiryMs(token) : 0;

  if (!token || expiresAt <= Date.now()) {
    return { user, token: null, expiresAt: 0 };
  }

  return { user, token, expiresAt };
}
