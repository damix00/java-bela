"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { internalApiFetch } from "@/lib/api/internal";
import {
    ADMIN_REFRESH_TOKEN_COOKIE,
    clearAdminSessionCookies,
    setAdminSessionCookies,
} from "@/lib/auth/session-cookies";
import type { BackendAuthResponse } from "@/lib/auth/types";

export async function login(formData: FormData) {
    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email !== "string" || typeof password !== "string") {
        redirect("/login?error=invalid");
    }

    const result = await internalApiFetch<BackendAuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });

    if (!result.ok) {
        redirect(
            result.status === 0 || result.status >= 500
                ? "/login?error=unavailable"
                : "/login?error=invalid",
        );
    }

    if (result.data.user.role !== "ADMIN") {
        if (result.data.refreshToken) {
            await internalApiFetch("/auth/logout", {
                method: "POST",
                body: JSON.stringify({
                    refreshToken: result.data.refreshToken,
                }),
            }).catch(() => null);
        }
        redirect("/login?error=forbidden");
    }

    setAdminSessionCookies(await cookies(), result.data);
    redirect("/");
}

export async function logout() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(ADMIN_REFRESH_TOKEN_COOKIE)?.value;

    if (refreshToken) {
        await internalApiFetch("/auth/logout", {
            method: "POST",
            body: JSON.stringify({ refreshToken }),
        }).catch(() => null);
    }

    clearAdminSessionCookies(cookieStore);
    redirect("/login");
}
