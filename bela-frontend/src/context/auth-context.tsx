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
    token: string;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    clearAuth: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
    children: ReactNode;
    initialUser: User | null;
    initialToken: string;
};

const staticUser: {
    user: User | null;
    jwt: string | null;
} = {
    user: null,
    jwt: null,
};

export function AuthProvider({
    children,
    initialUser,
    initialToken,
}: AuthProviderProps) {
    const [user, setUserState] = useState<User | null>(initialUser);
    const [token, setTokenState] = useState<string>(initialToken);

    staticUser.jwt = token;

    const setUser = useCallback((user: User | null) => {
        setUserState(user);
        staticUser.user = user;
    }, []);

    const clearAuth = useCallback(() => {
        setUserState(null);
        setTokenState("");
        staticUser.user = null;
        staticUser.jwt = null;
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
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

export { staticUser };
