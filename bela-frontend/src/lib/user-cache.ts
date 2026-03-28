// User Cache for client-side stored user data
import { apiFetch } from "@/api/client";

export interface PublicUserData {
    id: string;
    username: string;
    avatarUrl: string;
    createdAt: string;
}

type UserCacheType = Record<string, PublicUserData>;

const userCache: UserCacheType = {};

export async function getUserData(
    userId: string,
): Promise<PublicUserData | null> {
    if (userCache[userId]) {
        return userCache[userId];
    }

    const { status, data, error } = await apiFetch<PublicUserData>(
        `/users/${userId}`,
    );

    if (status === 200 && data) {
        userCache[userId] = data;
        return data;
    } else {
        console.error(`Failed to fetch user data for ${userId}:`, error);
        return null;
    }
}
