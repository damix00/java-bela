import "server-only";

import type {
    AdminAccountDetailResponse,
    AdminAccountPageResponse,
} from "@bela/protocol";
import { cookies } from "next/headers";

import { internalApiFetch } from "@/lib/api/internal";
import { ADMIN_ACCESS_TOKEN_COOKIE } from "@/lib/auth/session-cookies";

export type AccountFilters = {
    query?: string;
    accountType?: string;
    activity?: string;
    role?: string;
    cursor?: string;
};

export type AccountApiResult<T> =
    | { state: "ready"; data: T }
    | { state: "unauthenticated" }
    | { state: "forbidden" }
    | { state: "not-found" }
    | { state: "error"; message: string };

async function adminFetch<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<AccountApiResult<T>> {
    const token = (await cookies()).get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
    if (!token) {
        return { state: "unauthenticated" };
    }

    const result = await internalApiFetch<T>(endpoint, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });
    if (result.ok) {
        return { state: "ready", data: result.data };
    }
    if (result.status === 401) {
        return { state: "unauthenticated" };
    }
    if (result.status === 403) {
        return { state: "forbidden" };
    }
    if (result.status === 404) {
        return { state: "not-found" };
    }
    return { state: "error", message: result.message };
}

export async function getAdminAccounts(filters: AccountFilters) {
    const parameters = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
        if (value) {
            parameters.set(key, value);
        }
    }
    const query = parameters.size > 0 ? `?${parameters}` : "";
    return adminFetch<AdminAccountPageResponse>(`/admin/accounts${query}`);
}

export async function getAdminAccount(id: string) {
    return adminFetch<AdminAccountDetailResponse>(
        `/admin/accounts/${encodeURIComponent(id)}`,
    );
}

export async function forceAdminAccountSignOut(id: string) {
    return adminFetch<void>(
        `/admin/accounts/${encodeURIComponent(id)}/force-sign-out`,
        { method: "POST" },
    );
}

export async function changeAdminAccountRole(
    id: string,
    role: string,
    confirmUsername: string,
) {
    return adminFetch<AdminAccountDetailResponse>(
        `/admin/accounts/${encodeURIComponent(id)}/role`,
        {
            method: "PATCH",
            body: JSON.stringify({ role, confirmUsername }),
        },
    );
}

export async function deleteAdminAccount(
    id: string,
    confirmUsername: string,
) {
    return adminFetch<void>(`/admin/accounts/${encodeURIComponent(id)}`, {
        method: "DELETE",
        body: JSON.stringify({ confirmUsername }),
    });
}
