"use client";

import { useAuth } from "@/context/auth-context";

export default function GameScreen() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-4">
                    Welcome, {user?.username}!
                </h1>
                <p className="text-slate-400">Game screen coming soon...</p>
            </div>
        </div>
    );
}
