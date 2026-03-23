import "server-only";

export const INTERNAL_API_URL =
    process.env.INTERNAL_API_URL || "http://localhost:8080";

export const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY_SB;

export const AUTH_DURATION =
    parseInt(process.env.AUTH_LOGIN_DURATION_DAYS || "90") * 24 * 60 * 60; // in seconds

export async function internalApiFetch<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<{ status: number; data: T | null }> {
    const url = `${INTERNAL_API_URL}${endpoint}`;

    const headers = {
        "Content-Type": "application/json",
        "X-Internal-Source-Token": INTERNAL_API_KEY || "",
    };

    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
        cache: "no-store",
    });

    if (!response.ok) {
        return { status: response.status, data: null };
    }

    const data = await response.json();
    return { status: response.status, data };
}
