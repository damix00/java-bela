import { NextResponse, type NextRequest } from "next/server";

import {
    ADMIN_ACCESS_TOKEN_COOKIE,
    ADMIN_REFRESH_TOKEN_COOKIE,
    accessTokenExpiryMs,
    clearAdminSessionCookies,
    setAdminSessionCookies,
} from "@/lib/auth/session-cookies";
import { refreshAdminSession } from "@/lib/auth/refresh-session";

const ACCESS_TOKEN_SAFETY_WINDOW_MS = 60_000;

export async function proxy(request: NextRequest) {
    const refreshToken = request.cookies.get(
        ADMIN_REFRESH_TOKEN_COOKIE,
    )?.value;
    if (!refreshToken) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    const accessToken = request.cookies.get(ADMIN_ACCESS_TOKEN_COOKIE)?.value;
    if (
        accessToken &&
        accessTokenExpiryMs(accessToken) >
            Date.now() + ACCESS_TOKEN_SAFETY_WINDOW_MS
    ) {
        return NextResponse.next();
    }

    const refreshed = await refreshAdminSession(refreshToken);
    if (refreshed.state === "valid") {
        const response = NextResponse.redirect(request.nextUrl);
        setAdminSessionCookies(response.cookies, refreshed.session);
        return response;
    }

    if (refreshed.state === "rejected") {
        const response = NextResponse.redirect(
            new URL("/login?error=expired", request.url),
        );
        clearAdminSessionCookies(response.cookies);
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/"],
};
