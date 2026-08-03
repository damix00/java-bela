import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { internalApiFetch } from "@/api/internal";
import { BackendAuthResponse } from "@/api/types/user";
import {
    REFRESH_TOKEN_COOKIE,
    clearSessionCookies,
    setSessionCookies,
} from "@/actions/cookies";

/**
 * Exchanges the httpOnly refresh cookie for a fresh access token.
 *
 * A route handler rather than a server action because it must be callable from arbitrary
 * client code on a 401 — from apiFetch and from the WebSocket connect path, neither of which
 * runs inside a React event or transition.
 */
export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
        return NextResponse.json(
            { code: "BAD_ORIGIN", message: "Cross-origin refresh is not allowed" },
            { status: 403 },
        );
    }

    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

    if (!refreshToken) {
        return NextResponse.json(
            { code: "NO_SESSION", message: "No refresh token" },
            { status: 401 },
        );
    }

    const result = await internalApiFetch<BackendAuthResponse>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
    });

    if (result.ok && result.data) {
        setSessionCookies(cookieStore, result.data);

        // The refresh token itself never crosses back into client JS
        return NextResponse.json({
            accessToken: result.data.accessToken,
            expiresIn: result.data.expiresIn,
            user: result.data.user,
        });
    }

    if (result.status === 401) {
        clearSessionCookies(cookieStore);
        return NextResponse.json(
            {
                code: result.error?.code ?? "REFRESH_REJECTED",
                message: result.error?.message ?? "Session expired",
            },
            { status: 401 },
        );
    }

    // The backend is unreachable or broken. Leave the cookies alone — a transient outage
    // must not end a perfectly good session.
    return NextResponse.json(
        { code: "BACKEND_UNAVAILABLE", message: "Could not reach the server" },
        { status: 503 },
    );
}
