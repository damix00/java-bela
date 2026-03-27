"use client";

import { cn } from "@/lib/utils";
import BrandText from "@/components/brand/brand-text";
import { useAuth } from "@/context/auth-context";
import { BarChart3, LayoutGrid, Spade, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "../../brand/logo";
import { navItems } from "./items";

function SidebarNavItem({
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
                "flex items-center gap-4 px-6 py-4 text-foreground-muted transition-colors hover:text-foreground",
                active &&
                    "border-l-[3px] border-primary bg-background-tertiary text-foreground",
            )}>
            <Icon className="size-5" />
            <span className="font-medium">{label}</span>
        </Link>
    );
}

function UserProfile() {
    const auth = useAuth();
    const pathname = usePathname();
    const active = pathname === "/profile";

    return (
        <Link
            href="/profile"
            className={cn(
                "flex items-center gap-4 m-3 p-3 rounded-lg transition-colors hover:bg-background-tertiary",
                active && "bg-background-tertiary border-r-4 border-primary",
            )}>
            <div className="size-10 overflow-hidden p-0 rounded-full bg-foreground-muted">
                <img
                    src={auth.user?.avatarUrl || "https://picsum.photos/200"}
                    alt="Avatar"
                    className="size-full object-cover"
                />
            </div>
            <div className="flex flex-col">
                <span className="font-medium text-sm text-foreground">
                    {auth.user?.username}
                </span>
            </div>
        </Link>
    );
}

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden h-screen w-64 flex-col bg-background-secondary md:flex">
            <div className="px-6 h-20 flex items-center">
                <Logo size="lg" />
            </div>

            <nav className="flex flex-1 flex-col gap-1">
                {navItems.map((item) => (
                    <SidebarNavItem
                        key={item.href}
                        {...item}
                        active={pathname === item.href}
                    />
                ))}
            </nav>
            <UserProfile />
        </aside>
    );
}
