const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ApiError extends Error {
    constructor(
        public status: number,
        public message: string,
        public data?: unknown,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

interface FetchOptions extends RequestInit {
    token?: string;
}

export async function apiFetch<T>(
    endpoint: string,
    options: FetchOptions = {},
): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: any = {
        "Content-Type": "application/json",
        "X-Internal-Source-Token": process.env.INTERNAL_API_SECRET_BACKEND,
        ...fetchOptions.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...fetchOptions,
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(
                response.status,
                errorData.message || `HTTP error ${response.status}`,
                errorData,
            );
        }

        return await response.json();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(0, "Network error. Please check your connection.");
    }
}
