"use server";

import { AUTH_DURATION, internalApiFetch } from "@/api/internal";
import { AuthResponse } from "@/api/types/user";
import { cookies } from "next/headers";

async function storeCookie(key: string, value: string) {
    const cookieStore = await cookies();

    cookieStore.set(key, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: AUTH_DURATION,
    });
}

async function storeData(data: AuthResponse) {
    await storeCookie("token", data.jwt);
    await storeCookie("user", JSON.stringify(data.user));
}

async function getData(): Promise<AuthResponse | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const user = cookieStore.get("user")?.value;

    if (token && user) {
        return {
            jwt: token,
            user: JSON.parse(user),
        };
    }

    return null;
}

export async function refreshToken(): Promise<AuthResponse | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const resp = await internalApiFetch<AuthResponse>("/auth/refresh", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (resp.data) {
        await storeData(resp.data);

        return resp.data;
    }

    return null;
}

export async function register(
    username: string,
    email: string,
    password: string,
): Promise<AuthResponse | null> {
    const resp = await internalApiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
            username,
            email,
            password,
        }),
    });

    if (resp.data) {
        await storeData(resp.data);

        return resp.data;
    }

    return null;
}

export async function login(
    email: string,
    password: string,
): Promise<AuthResponse | null> {
    const resp = await internalApiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            usernameOrEmail: email,
            password,
        }),
    });

    if (resp.data) {
        await storeData(resp.data);

        return resp.data;
    }

    return null;
}

export async function logout() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    // await internalApiFetch("/auth/logout", {
    //     method: "POST",
    //     headers: {
    //         Authorization: `Bearer ${token}`,
    //     },
    // });

    cookieStore.delete("token");
    cookieStore.delete("user");
}

export async function getCurrentUser(): Promise<AuthResponse | null> {
    const data = await getData();

    if (data) {
        return data;
    }

    return null;
}

export async function isAuthenticated(): Promise<boolean> {
    const data = await getData();

    return !!data;
}
