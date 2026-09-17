export type AdminUser = {
    role: string;
};

export type BackendAuthResponse = {
    accessToken: string;
    refreshToken: string | null;
    expiresIn: number;
    refreshExpiresIn: number;
    user: AdminUser;
};
