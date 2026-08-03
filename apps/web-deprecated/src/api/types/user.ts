export type User = {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    role: string;
    createdAt: Date;
    lastLoginAt: Date;
};

/**
 * What the Next server hands to the browser. The refresh token is deliberately absent —
 * it lives only in an httpOnly cookie and never crosses into client JS.
 */
export type AuthResponse = {
    accessToken: string;
    /** Access token lifetime in seconds. */
    expiresIn: number;
    user: User;
};

/** The backend's response shape, seen only by server-side code. */
export type BackendAuthResponse = {
    accessToken: string;
    /** Null when a rotation landed in the grace window and the current token stays valid. */
    refreshToken: string | null;
    expiresIn: number;
    refreshExpiresIn: number;
    user: User;
};
