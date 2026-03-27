"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./items";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

function MobileNavItem({
    label,
    href,
    icon: Icon,
    active,
}: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    active: boolean;
}) {
    return (
        <Link
            href={href}
            className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-foreground-muted transition-colors",
                active && "text-primary",
            )}>
            <Icon className="size-6" />
            <span className="text-xs font-medium">{label}</span>
        </Link>
    );
}

function ProfileMobileItem({ active }: { active: boolean }) {
    const auth = useAuth();

    return (
        <Link
            href="/profile"
            className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-foreground-muted transition-colors",
                active && "text-primary",
            )}>
            <div
                className={cn(
                    "size-6 overflow-hidden rounded-full bg-foreground-muted",
                    active &&
                        "ring-2 ring-primary ring-offset-2 ring-offset-background-secondary",
                )}>
                <img
                    src={auth.user?.avatarUrl || "https://picsum.photos/200"}
                    alt="Profile"
                    className="size-full object-cover"
                />
            </div>
            <span className="text-xs font-medium">Profile</span>
        </Link>
    );
}

export default function BottomBar() {
    const pathname = usePathname();

    return (
        <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-white/10 bg-background-secondary px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
            {navItems.map((item) => (
                <MobileNavItem
                    key={item.href}
                    {...item}
                    active={pathname === item.href}
                />
            ))}
            <ProfileMobileItem active={pathname === "/profile"} />
        </nav>
    );
}
