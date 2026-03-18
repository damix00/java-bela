"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Lobby() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border">
                <div className="container mx-auto flex items-center justify-between px-4 py-4">
                    <h1 className="font-display text-2xl font-bold">
                        Belo<span className="text-primary">te</span>
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            {user?.username}
                        </span>
                        <Button variant="ghost" size="sm" onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                        </Button>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 py-12">
                <div className="flex flex-col items-center justify-center text-center">
                    <h2 className="font-display text-4xl font-bold">
                        Welcome, {user?.username}!
                    </h2>
                    <p className="mt-4 text-muted-foreground">
                        The lobby is coming soon. Stay tuned!
                    </p>
                </div>
            </main>
        </div>
    );
}
