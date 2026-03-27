import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";
import { GameProviders } from "./providers";

export default async function GameLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user) {
        return redirect("/");
    }

    return <GameProviders>{children}</GameProviders>;
}
