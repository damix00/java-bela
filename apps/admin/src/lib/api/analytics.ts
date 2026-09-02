import "server-only";

import type { AdminAnalyticsResponse } from "@bela/protocol";
import { cookies } from "next/headers";

import { internalApiFetch } from "@/lib/api/internal";
import { ADMIN_ACCESS_TOKEN_COOKIE } from "@/lib/auth/session-cookies";

export type AnalyticsResult =
    | { state: "ready"; data: AdminAnalyticsResponse }
    | { state: "unauthenticated" }
    | { state: "forbidden" }
    | { state: "unavailable"; message: string };

export async function getAdminAnalytics(): Promise<AnalyticsResult> {
    const accessToken = (await cookies()).get(
        ADMIN_ACCESS_TOKEN_COOKIE,
    )?.value;
    if (!accessToken) {
        return { state: "unauthenticated" };
    }

    const result = await internalApiFetch<AdminAnalyticsResponse>(
        "/admin/analytics",
        {
            headers: { Authorization: `Bearer ${accessToken}` },
        },
    );

    if (result.ok) {
        return { state: "ready", data: result.data };
    }
    if (result.status === 401) {
        return { state: "unauthenticated" };
    }
    if (result.status === 403) {
        return { state: "forbidden" };
    }
    return { state: "unavailable", message: result.message };
}
