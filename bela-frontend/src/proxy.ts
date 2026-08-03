import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { REFRESH_TOKEN_COOKIE } from "@/actions/cookies";

/**
 * Cookie-local only, no network I/O. Proxy runs on every matched request and may be deployed
 * to the edge, so refreshing the session here — as this file used to — meant one backend
 * round trip per navigation, and a single transient 5xx logged everyone out. Refreshing now
 * lives in /api/auth/refresh, driven by the client when a request actually comes back 401.
 */
export function proxy(request: NextRequest) {
    const hasSession = !!request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

    if (!hasSession) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Only the authenticated game routes; everything else needs no gate at all.
    matcher: ["/home/:path*", "/play/:path*"],
};
