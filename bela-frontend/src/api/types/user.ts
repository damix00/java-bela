export type User = {
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt: Date;
    lastLoginAt: Date;
};

export type AuthResponse = {
    jwt: string;
    user: User;
};
