import { cn } from "@/lib/utils";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export default function TextInput({
    label,
    className,
    id,
    ...props
}: TextInputProps) {
    return (
        <div className="flex flex-col gap-2">
            {label && (
                <label
                    htmlFor={id}
                    className="text-xs text-foreground-muted font-heading uppercase font-bold tracking-wider">
                    {label}
                </label>
            )}
            <input
                id={id}
                className={cn(
                    "w-full px-4 py-2 rounded-lg bg-background-secondary border border-foreground-muted/20 text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:border-primary transition-colors",
                    className,
                )}
                {...props}
            />
        </div>
    );
}
