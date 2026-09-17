import "server-only";

import { authenticatedApiFetch } from "@/api/authenticated";
import type { PublicUser } from "@/api/types/user";

export type PublicProfileResult =
    | { state: "found"; user: PublicUser }
    | { state: "not-found" }
    | { state: "unauthorized" }
    | { state: "unavailable" }
    | { state: "failed"; status: number };

/** Reads one profile without letting a missing player hide unrelated failures. */
export async function getPublicProfile(
    username: string,
): Promise<PublicProfileResult> {
    const result = await authenticatedApiFetch<PublicUser>(
        `/users/by-username/${encodeURIComponent(username)}`,
    );

    if (result.ok && result.data) {
        return { state: "found", user: result.data };
    }

    if (result.status === 404) return { state: "not-found" };
    if (result.status === 401) return { state: "unauthorized" };
    if (result.status === 0) return { state: "unavailable" };

    return { state: "failed", status: result.status };
}
