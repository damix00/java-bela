import { internalApiFetch } from "@/lib/api/internal";
import type { BackendAuthResponse } from "@/lib/auth/types";

export type RefreshResult =
    | { state: "valid"; session: BackendAuthResponse }
    | { state: "rejected" }
    | { state: "unavailable" };

export async function refreshAdminSession(
    refreshToken: string,
): Promise<RefreshResult> {
    const result = await internalApiFetch<BackendAuthResponse>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
        signal: AbortSignal.timeout(1000),
    });

    if (result.ok) {
        if (result.data.user.role !== "ADMIN") {
            return { state: "rejected" };
        }
        return { state: "valid", session: result.data };
    }

    return result.status === 401
        ? { state: "rejected" }
        : { state: "unavailable" };
}
