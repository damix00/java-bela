import { cn } from "@/app/lib/utils";

export type ButtonVariant =
    | "filled"
    | "outlinePrimary"
    | "ghostPrimary"
    | "text"
    | "textPrimary";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    href?: string;
}

export default function Button({
    variant = "filled",
    size = "md",
    className = "",
    href,
    ...props
}: ButtonProps) {
    const classNames = cn(
        "flex items-center text-center justify-center select-none font-body text-sm rounded-md px-4 py-2 cursor-pointer hover:opacity-90 active:opacity-80",
        variant == "filled" && "bg-primary text-on-primary",
        variant == "outlinePrimary" && "border border-primary text-primary",
        variant == "ghostPrimary" && "text-primary bg-primary-muted",
        variant == "textPrimary" && "text-primary",
        variant == "text" && "text-foreground-muted hover:text-foreground",
        size == "sm" && "text-xs",
        size == "lg" && "text-base px-6 py-3",
        className,
    );

    if (href) {
        return (
            <a href={href} className={classNames} {...props}>
                {props.children}
            </a>
        );
    }

    return <button className={classNames} {...props} />;
}
