import { cn } from "@/lib/utils";

export type LogoSize = "sm" | "md" | "lg" | "xl";

interface LogoProps {
    size?: LogoSize;
    className?: string;
}

export default function Logo({ size = "md", className }: LogoProps) {
    return (
        <span
            className={cn(
                "font-heading uppercase font-black tracking-tight text-foreground select-none",
                size === "sm" && "text-lg",
                size === "md" && "text-xl",
                size === "lg" && "text-2xl",
                size === "xl" && "text-3xl",
                className,
            )}>
            Belote.gg
        </span>
    );
}
