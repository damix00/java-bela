import { NextResponse } from "next/server";

import { getAdminAccounts } from "@/lib/api/accounts";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const result = await getAdminAccounts({
        query: url.searchParams.get("query") ?? undefined,
        accountType: url.searchParams.get("accountType") ?? undefined,
        activity: url.searchParams.get("activity") ?? undefined,
        role: url.searchParams.get("role") ?? undefined,
        cursor: url.searchParams.get("cursor") ?? undefined,
    });

    if (result.state === "ready") {
        return NextResponse.json(result.data);
    }
    const status = result.state === "unauthenticated"
        ? 401
        : result.state === "forbidden"
            ? 403
            : 502;
    return NextResponse.json(
        {
            message: result.state === "error"
                ? result.message
                : "Account data is unavailable",
        },
        { status },
    );
}
