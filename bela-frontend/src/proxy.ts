import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { internalApiFetch, AUTH_DURATION } from "@/api/internal";
import { AuthResponse } from "@/api/types/user";

export async function proxy(request: NextRequest) {
    const response = NextResponse.next();

    const token = request.cookies.get("token")?.value;

    if (token) {
        // Fetch a new token and user data from the backend
        const resp = await internalApiFetch<AuthResponse>("/auth/refresh", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (resp.data) {
            const { jwt, user } = resp.data;

            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict" as const,
                maxAge: AUTH_DURATION,
            };

            // 1. Set on the response so the browser updates its cookies
            response.cookies.set("token", jwt, cookieOptions);
            response.cookies.set("user", JSON.stringify(user), cookieOptions);

            // 2. Set on the request so downstream Server Components (like RootLayout) can see the updated cookies immediately during this request
            response.cookies.set("token", jwt, cookieOptions);
            request.cookies.set("token", jwt);
            request.cookies.set("user", JSON.stringify(user));
        } else {
            // If the refresh token was rejected, we should clear the cookies
            response.cookies.delete("token");
            response.cookies.delete("user");
            request.cookies.delete("token");
            request.cookies.delete("user");
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};
