import "server-only";

export const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL || "http://localhost:8080";

export const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY_SB;

const REQUEST_TIMEOUT_MS = 5000;

export type ApiError = {
  message?: string;
  code?: string;
};

export type InternalApiResult<T> = {
  ok: boolean;
  /** 0 means the request never reached the backend. */
  status: number;
  data: T | null;
  error: ApiError | null;
};

/**
 * Server-to-server fetch against the Spring API. Marked `server-only` because
 * it carries the internal source token, which must never end up in a client
 * bundle.
 */
export async function internalApiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<InternalApiResult<T>> {
  const url = `${INTERNAL_API_URL}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    "X-Internal-Source-Token": INTERNAL_API_KEY || "",
  };

  let response: Response;
  try {
    response = await fetch(url, {
      // The default budget, spread over so a caller can pass a tighter
      // `signal` of its own — the proxy does, since it sits in front of a
      // navigation and cannot make the player wait five seconds.
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      cache: "no-store",
    });
  } catch (error) {
    // Status 0 keeps callers from mistaking a backend outage for a rejected
    // session — the two demand opposite responses, one retries and one logs out.
    return {
      ok: false,
      status: 0,
      data: null,
      error: {
        code: "NETWORK",
        message: error instanceof Error ? error.message : "Network error",
      },
    };
  }

  if (!response.ok) {
    // The error body carries the backend's `code`, which callers branch on
    const error = (await response.json().catch(() => null)) as ApiError | null;
    return { ok: false, status: response.status, data: null, error };
  }

  if (response.status === 204) {
    return { ok: true, status: response.status, data: null, error: null };
  }

  const data = (await response.json()) as T;
  return { ok: true, status: response.status, data, error: null };
}
