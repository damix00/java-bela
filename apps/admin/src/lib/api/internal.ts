import "server-only";

const INTERNAL_API_URL =
    process.env.INTERNAL_API_URL || "http://localhost:8080";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY_SB || "";
const REQUEST_TIMEOUT_MS = 5000;

export type InternalApiResult<T> =
    | { ok: true; status: number; data: T }
    | { ok: false; status: number; message: string };

export async function internalApiFetch<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<InternalApiResult<T>> {
    let response: Response;
    try {
        response = await fetch(`${INTERNAL_API_URL}${endpoint}`, {
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            ...options,
            headers: {
                "Content-Type": "application/json",
                "X-Internal-Source-Token": INTERNAL_API_KEY,
                ...options.headers,
            },
            cache: "no-store",
        });
    } catch (error) {
        return {
            ok: false,
            status: 0,
            message: error instanceof Error ? error.message : "Network error",
        };
    }

    if (!response.ok) {
        const error = (await response.json().catch(() => null)) as {
            message?: string;
        } | null;
        return {
            ok: false,
            status: response.status,
            message: error?.message ?? `Request failed (${response.status})`,
        };
    }

    return {
        ok: true,
        status: response.status,
        data: (await response.json()) as T,
    };
}
