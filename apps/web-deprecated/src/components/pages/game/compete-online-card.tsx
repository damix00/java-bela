"use client";

import { Globe } from "lucide-react";
import Button from "@/components/input/button";
import { cn } from "@/lib/utils";

interface CompeteOnlineCardProps {
    onQuickMatch: () => void;
    loading?: boolean;
    className?: string;
}

export default function CompeteOnlineCard({
    onQuickMatch,
    loading,
    className,
}: CompeteOnlineCardProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden flex flex-col items-end justify-between rounded-2xl h-96 bg-background-secondary border border-background-tertiary p-6",
                className,
            )}>
            {/* Decorative cards in background */}
            <div className="absolute -left-4 -bottom-6 opacity-20 pointer-events-none">
                <div className="relative">
                    <div className="absolute w-16 h-24 rounded-lg bg-foreground-muted/30 rotate-[-15deg] translate-x-2" />
                    <div className="absolute w-16 h-24 rounded-lg bg-foreground-muted/40 rotate-[5deg] -translate-x-4 translate-y-2" />
                    <div className="w-16 h-24 rounded-lg bg-foreground-muted/50 rotate-[25deg] translate-x-6 -translate-y-2" />
                </div>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                    <div className="p-4 mb-4 border border-primary/20 bg-primary-muted rounded-xl w-fit h-fit">
                        <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="font-body text-2xl mb-2 font-bold">
                        Compete Online
                    </h2>
                    <p className="text-foreground-muted text-sm max-w-md">
                        Jump into a match with players from around the world.
                        Our matchmaking system finds you the perfect opponents.
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1">
                <Button onClick={onQuickMatch} loading={loading} size="lg">
                    Quick match
                </Button>
            </div>
        </div>
    );
}
