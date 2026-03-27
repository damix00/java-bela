export type User = {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    role: string;
    createdAt: Date;
    lastLoginAt: Date;
};

export type AuthResponse = {
    jwt: string;
    user: User;
};
