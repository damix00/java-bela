import { cn } from "@/lib/utils";

interface PlayingCardProps {
    suit: string;
    rank: string;
    color: string;
    className?: string;
}

export function PlayingCard({
    suit,
    rank,
    color,
    className,
}: PlayingCardProps) {
    return (
        <div
            className={cn(
                "w-32 md:w-48 lg:w-64 aspect-2.5/3.5",
                "bg-card rounded-xl md:rounded-2xl border border-border/40",
                "shadow-xl relative overflow-hidden",
                className,
            )}>
            <div className="absolute top-2 left-2 md:top-4 md:left-4 text-sm md:text-xl lg:text-2xl flex flex-col items-center leading-none">
                <span className={color}>{rank}</span>
                <span className={color}>{suit}</span>
            </div>

            {/* Using absolute inset-0 effectively perfectly centers the middle suit icon, bypassing flexbox side-effects */}
            <div
                className={cn(
                    "absolute inset-0 flex items-center justify-center text-4xl md:text-7xl lg:text-8xl font-bold font-display opacity-50",
                    color,
                )}>
                <span>{suit}</span>
            </div>

            <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 text-sm md:text-xl lg:text-2xl flex flex-col items-center rotate-180 leading-none">
                <span className={color}>{rank}</span>
                <span className={color}>{suit}</span>
            </div>
        </div>
    );
}
