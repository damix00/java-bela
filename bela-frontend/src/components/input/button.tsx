import { cn } from "@/app/lib/utils";

export type ButtonVariant = "filled" | "outline" | "ghost" | "text";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}

export default function Button({
    variant = "filled",
    size = "md",
    className = "",
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                "select-none font-body text-sm rounded-md px-4 py-2 cursor-pointer hover:opacity-90 active:opacity-80",
                variant == "filled" && "bg-primary text-on-primary",
                variant == "outline" && "border border-primary text-primary",
                variant == "ghost" && "text-primary bg-primary-muted",
                variant == "text" && "text-primary",
                size == "sm" && "text-xs",
                size == "lg" && "text-base px-6 py-3",
                className,
            )}
            {...props}
        />
    );
}
