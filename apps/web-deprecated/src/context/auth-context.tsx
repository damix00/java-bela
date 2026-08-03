"use client";

import { User } from "@/api/types/user";
import {
    AuthSnapshot,
    clearAuth as clearAuthStore,
    getAuthSnapshot,
    setAuth,
    subscribeAuth,
} from "@/api/token-store";
import {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useState,
    useSyncExternalStore,
    ReactNode,
} from "react";

type AuthContextType = {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    clearAuth: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
    initialUser: User | null;
    initialToken: string | null;
    initialExpiresAt: number;
};

export function AuthProvider({
    children,
    initialUser,
    initialToken,
    initialExpiresAt,
}: AuthProviderProps) {
    // Stable across renders, so useSyncExternalStore doesn't see a new object every pass
    const [serverSnapshot] = useState<AuthSnapshot>(() => ({
        token: initialToken,
        expiresAt: initialToken ? initialExpiresAt : 0,
        user: initialUser,
        status: initialUser ? "authenticated" : "unauthenticated",
    }));

    // Seeding happens in an effect, never during render: the store is module state, and
    // mutating module state while rendering is exactly what React Compiler will punish.
    useEffect(() => {
        setAuth({
            token: initialToken,
            expiresAt: initialToken ? initialExpiresAt : 0,
            user: initialUser,
            status: initialUser ? "authenticated" : "unauthenticated",
        });
    }, [initialUser, initialToken, initialExpiresAt]);

    const snapshot = useSyncExternalStore(
        subscribeAuth,
        getAuthSnapshot,
        () => serverSnapshot,
    );

    const setUser = useCallback((user: User | null) => {
        setAuth({ user, status: user ? "authenticated" : "unauthenticated" });
    }, []);

    const clearAuth = useCallback(() => {
        clearAuthStore();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user: snapshot.user,
                token: snapshot.token,
                isAuthenticated: !!snapshot.user,
                setUser,
                clearAuth,
            }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
