import { cn } from "@/app/lib/utils";
import { ClassValue } from "clsx";

export default function BrandText({
    children,
    className,
}: {
    children?: React.ReactNode;
    className?: ClassValue;
}) {
    return (
        <span
            className={cn(
                "font-heading uppercase font-black tracking-tight text-foreground text-2xl",
                className,
            )}>
            {children}
        </span>
    );
}
