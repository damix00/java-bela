"use client";

import { AuthResponse, User } from "@/api/types/user";

export type AuthStatus = "authenticated" | "unauthenticated";

export type AuthSnapshot = {
    token: string | null;
    /** Epoch ms at which the access token stops being valid. */
    expiresAt: number;
    user: User | null;
    status: AuthStatus;
};

/**
 * The single source of truth for the access token on the client. It lives outside React so
 * that apiFetch and the WebSocket — neither of which is a component — can read it, and it is
 * observable so the auth context stays in step via useSyncExternalStore.
 *
 * The snapshot object is always *replaced*, never mutated, otherwise useSyncExternalStore
 * cannot see a change.
 */
let snapshot: AuthSnapshot = {
    token: null,
    expiresAt: 0,
    user: null,
    status: "unauthenticated",
};

const listeners = new Set<() => void>();

/** Refresh a little before the token actually dies, to absorb clock skew and latency. */
const REFRESH_MARGIN_MS = 60_000;

export function getAuthSnapshot(): AuthSnapshot {
    return snapshot;
}

export function subscribeAuth(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function setAuth(next: Partial<AuthSnapshot>) {
    snapshot = { ...snapshot, ...next };
    listeners.forEach((listener) => listener());
}

export function clearAuth() {
    setAuth({
        token: null,
        expiresAt: 0,
        user: null,
        status: "unauthenticated",
    });
}

export function applyAuthResponse(auth: AuthResponse) {
    setAuth({
        token: auth.accessToken,
        expiresAt: Date.now() + auth.expiresIn * 1000,
        user: auth.user,
        status: "authenticated",
    });
}

let inFlight: Promise<string | null> | null = null;

/**
 * Exchanges the httpOnly refresh cookie for a new access token.
 *
 * Single-flight: concurrent callers share one promise, so N simultaneous 401s produce exactly
 * one round trip rather than N competing rotations.
 *
 * @returns the new access token, or null if the session is over *or* the backend is down —
 *          the difference is that only the former clears local auth state.
 */
export function refreshAccessToken(): Promise<string | null> {
    if (inFlight) {
        return inFlight;
    }

    inFlight = fetch("/api/auth/refresh", { method: "POST" })
        .then(async (response) => {
            if (response.status === 401) {
                clearAuth();
                return null;
            }

            if (!response.ok) {
                // 503: the backend is unreachable. Keep the session — it may well come back.
                return null;
            }

            const auth = (await response.json()) as AuthResponse;
            applyAuthResponse(auth);
            return auth.accessToken;
        })
        .catch(() => null)
        .finally(() => {
            inFlight = null;
        });

    return inFlight;
}

/** Returns a token that is good for at least another minute, refreshing only if needed. */
export function ensureFreshToken(): Promise<string | null> {
    const { token, expiresAt } = snapshot;

    if (token && expiresAt - Date.now() > REFRESH_MARGIN_MS) {
        return Promise.resolve(token);
    }

    return refreshAccessToken();
}
