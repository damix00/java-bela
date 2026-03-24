import { cn } from "@/app/lib/utils";

export type AuthPatternVariant = "default" | "primary";

export default function AuthPattern({
    variant = "default",
}: {
    variant?: AuthPatternVariant;
}) {
    const color =
        variant === "primary"
            ? "var(--color-primary)"
            : "var(--foreground-muted)";
    return (
        <svg
            className={cn(
                `absolute inset-0 w-full h-full -rotate-30 scale-200 opacity-10 select-none`,
            )}
            viewBox="0 0 500 500"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern
                    id={`card-suits-${variant}`}
                    width="80"
                    height="56"
                    patternUnits="userSpaceOnUse">
                    {/* Club */}
                    <text x="5" y="20" fontSize="24" fill={color}>
                        ♣
                    </text>
                    {/* Diamond */}
                    <text x="45" y="20" fontSize="24" fill={color}>
                        ♦
                    </text>
                    {/* Heart */}
                    <text x="25" y="48" fontSize="24" fill={color}>
                        ♥
                    </text>
                    {/* Spade */}
                    <text x="65" y="48" fontSize="24" fill={color}>
                        ♠
                    </text>
                </pattern>
            </defs>
            <rect
                width="100%"
                height="100%"
                fill={`url(#card-suits-${variant})`}
            />
        </svg>
    );
}
