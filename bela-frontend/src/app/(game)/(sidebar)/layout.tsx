import GameNav from "@/components/nav/game/game-nav";

export default function SidebarLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    console.log("Rendering SidebarLayout");

    return (
        <div className="flex h-dvh w-full overflow-hidden">
            <GameNav />
            <main className="flex-1 overflow-auto pb-20 md:overflow-hidden md:pb-0">
                {children}
            </main>
        </div>
    );
}
