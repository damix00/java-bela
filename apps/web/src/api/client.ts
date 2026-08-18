"use client";

import {
  ensureFreshToken,
  getAuthSnapshot,
  refreshAccessToken,
} from "@/api/token-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type ApiResult<T> = {
  status: number;
  data: T | null;
  error?: string;
  code?: string;
};

/**
 * Browser-to-API fetch for authenticated calls. Unlike the credential exchanges
 * in `actions/auth.ts`, these go straight to the Spring API with a bearer token
 * rather than through the BFF — there is no cookie to set, so the extra hop
 * would buy nothing.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  // A token about to expire is cheaper to replace now than to have rejected and retried
  await ensureFreshToken();

  const first = await send<T>(endpoint, options);

  // TOKEN_EXPIRED means a refresh will fix it; USER_GONE or a bad signature never will
  if (first.status !== 401 || first.code === "USER_GONE") {
    return first;
  }

  const token = await refreshAccessToken();
  if (!token) {
    return first;
  }

  return send<T>(endpoint, options, token);
}

async function send<T>(
  endpoint: string,
  options: RequestInit,
  tokenOverride?: string,
): Promise<ApiResult<T>> {
  const url = `${API_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  const token = tokenOverride ?? getAuthSnapshot().token;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        status: response.status,
        data: null,
        error: errorData?.message || `HTTP error ${response.status}`,
        code: errorData?.code,
      };
    }

    const data = (await response.json()) as T;
    return { status: response.status, data };
  } catch (error) {
    return {
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
