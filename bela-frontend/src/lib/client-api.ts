"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ClientApiError extends Error {
    constructor(
        public status: number,
        public message: string,
        public data?: unknown,
    ) {
        super(message);
        this.name = "ClientApiError";
    }
}

interface FetchOptions extends RequestInit {
    token?: string;
}

/**
 * Client-side API fetch utility
 * Note: For authenticated requests, you'll need to pass the token
 * since client components can't access httpOnly cookies
 */
export async function clientApiFetch<T>(
    endpoint: string,
    options: FetchOptions = {},
): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: any = {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...fetchOptions,
            headers,
            credentials: "include", // Include cookies for CORS
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ClientApiError(
                response.status,
                errorData.message || `HTTP error ${response.status}`,
                errorData,
            );
        }

        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
            return await response.json();
        }

        return null as T;
    } catch (error) {
        if (error instanceof ClientApiError) {
            throw error;
        }
        throw new ClientApiError(
            0,
            "Network error. Please check your connection.",
        );
    }
}
