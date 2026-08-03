import AuthPattern, { type AuthPatternVariant } from "./bg/auth-pattern";
import BackToHome from "./back-to-home";
import AuthBgText from "./bg/auth-bg-text";
import { cn } from "@/lib/utils";

export default function AuthPage({
    className,
    children,
    eyebrow,
    headline,
    patternVariant = "default",
}: {
    className?: string;
    children: React.ReactNode;
    eyebrow: string;
    headline: string;
    patternVariant?: AuthPatternVariant;
}) {
    return (
        <div className="min-h-screen flex w-full">
            {/* Left half (not visible on mobile) */}
            <div
                className={cn(
                    "hidden md:flex w-1/2 bg-background-secondary flex-col items-start justify-end pb-12 relative overflow-hidden",
                    patternVariant == "primary" && "bg-primary/5",
                )}>
                <BackToHome />
                <div className="w-full max-w-2/3 px-8">
                    <AuthBgText eyebrow={eyebrow} headline={headline} />
                    <AuthPattern variant={patternVariant} />
                </div>
            </div>

            <div
                className={cn(
                    "flex flex-col w-full md:w-1/2 p-8 md:p-16",
                    className,
                )}>
                {children}
            </div>
        </div>
    );
}
