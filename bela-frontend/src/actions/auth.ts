"use server";

import { cookies } from "next/headers";
import { apiFetch, ApiError } from "@/lib/api";

const AUTH_COOKIE_NAME = "bela_auth";
const TOKEN_COOKIE_NAME = "bela_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface User {
    id: string;
    email: string;
    username: string;
}

interface LoginResponse {
    token: string;
    user: User;
}

interface RegisterResponse {
    token: string;
    user: User;
}

export async function getAuthCookie(): Promise<User | null> {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(AUTH_COOKIE_NAME);
    if (!cookie) return null;

    try {
        return JSON.parse(cookie.value) as User;
    } catch {
        return null;
    }
}

export async function getAuthToken(): Promise<string | null> {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(TOKEN_COOKIE_NAME);
    return cookie?.value || null;
}

async function setAuthCookie(user: User, token: string): Promise<void> {
    const cookieStore = await cookies();

    // Store user data
    cookieStore.set(AUTH_COOKIE_NAME, JSON.stringify(user), {
        path: "/",
        maxAge: COOKIE_MAX_AGE,
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    });

    // Store JWT token
    cookieStore.set(TOKEN_COOKIE_NAME, token, {
        path: "/",
        maxAge: COOKIE_MAX_AGE,
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    });
}

async function deleteAuthCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);
    cookieStore.delete(TOKEN_COOKIE_NAME);
}

export async function loginAction(
    email: string,
    password: string,
): Promise<User> {
    try {
        const response = await apiFetch<LoginResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ usernameOrEmail: email, password }),
        });

        await setAuthCookie(response.user, response.token);
        return response.user;
    } catch (error) {
        if (error instanceof ApiError) {
            throw new Error(error.message);
        }
        throw new Error("Login failed. Please try again.");
    }
}

export async function registerAction(
    email: string,
    username: string,
    password: string,
): Promise<User> {
    try {
        const response = await apiFetch<RegisterResponse>("/auth/register", {
            method: "POST",
            body: JSON.stringify({ email, username, password }),
        });

        await setAuthCookie(response.user, response.token);
        return response.user;
    } catch (error) {
        if (error instanceof ApiError) {
            throw new Error(error.message);
        }
        throw new Error("Registration failed. Please try again.");
    }
}

export async function logoutAction(): Promise<void> {
    await deleteAuthCookie();
}
