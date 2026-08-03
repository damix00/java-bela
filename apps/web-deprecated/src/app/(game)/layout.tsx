import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";
import { GameProviders } from "./providers";

export default async function GameLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // getCurrentUser keys off the refresh cookie, so an expired access token — the normal
    // state after 15 minutes — does not bounce a logged-in user out.
    const user = await getCurrentUser();

    if (!user) {
        return redirect("/");
    }

    return <GameProviders>{children}</GameProviders>;
}
