import type { PublicUser } from "@/api/types/user";
import AccountPage from "@/components/layout/AccountPage";
import ProfileFacts from "@/components/pages/profile/blocks/ProfileFacts";
import ProfileHero from "@/components/pages/profile/blocks/ProfileHero";
import type { Dictionary } from "@/dictionaries";
import type { Locale } from "@/lib/i18n/config";

type PublicProfileScreenProps = {
    copy: Dictionary["profile"];
    locale: Locale;
    user: PublicUser;
};

/** The current profile presentation, stripped of owner-only account controls. */
export default function PublicProfileScreen({
    copy,
    locale,
    user,
}: PublicProfileScreenProps) {
    return (
        <AccountPage>
            <ProfileHero
                username={user.username}
                avatarUrl={user.avatarUrl}
                bio={user.bio}
                countryCode={user.countryCode}
                createdAt={user.createdAt}
                copy={copy}
                locale={locale}
            />

            <ProfileFacts
                countryCode={user.countryCode}
                createdAt={user.createdAt}
                copy={copy}
                locale={locale}
            />
        </AccountPage>
    );
}
