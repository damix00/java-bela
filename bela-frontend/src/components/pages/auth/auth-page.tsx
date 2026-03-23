import AuthPattern from "./bg/auth-pattern";
import BackToHome from "./back-to-home";
import AuthBgText from "./bg/auth-bg-text";
import { cn } from "@/app/lib/utils";

export default function AuthPage({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex w-full">
            {/* Left half (not visible on mobile) */}
            <div className="hidden md:flex w-1/2 bg-background-secondary flex-col items-start justify-end pb-12 relative overflow-hidden">
                <BackToHome />
                <div className="w-full max-w-2/3 px-8">
                    <AuthBgText />
                    <AuthPattern />
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
