const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<{ status: number; data: T | null; error?: string }> {
    const url = `${API_URL}${endpoint}`;

    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            return {
                status: response.status,
                data: null,
                error: errorData?.message || `HTTP error ${response.status}`,
            };
        }

        const data = await response.json();
        return { status: response.status, data };
    } catch (error) {
        return {
            status: 0,
            data: null,
            error: error instanceof Error ? error.message : "Network error",
        };
    }
}
