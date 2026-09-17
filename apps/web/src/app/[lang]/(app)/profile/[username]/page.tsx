import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/actions/auth";
import { getPublicProfile } from "@/api/public-profile";
import PublicProfileScreen from "@/components/pages/profile/sections/PublicProfileScreen";
import { localePage } from "@/dictionaries";
import {
    profilePath,
    publicProfilePath,
    signInPathWithReturn,
} from "@/lib/navigation/routes";

type ProfilePageProps = PageProps<"/[lang]/profile/[username]">;

export async function generateMetadata({
    params,
}: ProfilePageProps): Promise<Metadata> {
    const [{ dict }, { username }] = await Promise.all([
        localePage(params),
        params,
    ]);

    return {
        title: dict.profile.publicTitle.replace("{username}", username),
        robots: { index: false, follow: false },
    };
}

/** A read-only view of the fields one player has chosen to show another. */
export default async function Page({ params }: ProfilePageProps) {
    const [{ lang, dict }, { username }, currentUser] = await Promise.all([
        localePage(params),
        params,
        getCurrentUser(),
    ]);

    const path = publicProfilePath(lang, username);

    if (!currentUser) {
        redirect(signInPathWithReturn(lang, path));
    }

    if (currentUser.username === username) {
        redirect(profilePath(lang));
    }

    const result = await getPublicProfile(username);

    if (result.state === "not-found") {
        notFound();
    }

    if (result.state === "unauthorized") {
        throw new Error("The profile request was not authorized");
    }

    if (result.state === "unavailable") {
        throw new Error("The profile service is unavailable");
    }

    if (result.state === "failed") {
        throw new Error(`The profile request failed with ${result.status}`);
    }

    return (
        <PublicProfileScreen
            copy={dict.profile}
            locale={lang}
            user={result.user}
        />
    );
}
