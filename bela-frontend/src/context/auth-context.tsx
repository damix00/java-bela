"use client";

import { User } from "@/api/types/user";
import {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
} from "react";

type AuthContextType = {
    user: User | null;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    clearAuth: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
    initialUser: User | null;
};

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
    const [user, setUserState] = useState<User | null>(initialUser);

    const setUser = useCallback((user: User | null) => {
        setUserState(user);
    }, []);

    const clearAuth = useCallback(() => {
        setUserState(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
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
