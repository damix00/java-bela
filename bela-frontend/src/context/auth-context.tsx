"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
} from "react";
import {
    loginAction,
    registerAction,
    logoutAction,
    type User,
} from "@/actions/auth";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (
        email: string,
        username: string,
        password: string,
    ) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
    initialUser: User | null;
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(initialUser);
    const [isLoading, setIsLoading] = useState(false);

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const loggedInUser = await loginAction(email, password);
            setUser(loggedInUser);
        } catch (error) {
            setIsLoading(false);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(
        async (email: string, username: string, password: string) => {
            setIsLoading(true);
            try {
                const registeredUser = await registerAction(
                    email,
                    username,
                    password,
                );
                setUser(registeredUser);
            } catch (error) {
                setIsLoading(false);
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
        [],
    );

    const logout = useCallback(async () => {
        await logoutAction();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
            }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
