import { redirect } from "next/navigation";

import { getCurrentUser } from "@/actions/auth";
import SettingsScreen from "@/components/pages/settings/sections/SettingsScreen";
import { localePage } from "@/dictionaries";
import { localeMetadata } from "@/lib/i18n/metadata";
import { settingsPath, signInPathWithReturn } from "@/lib/navigation/routes";

export const generateMetadata = localeMetadata((dict) => ({
    title: dict.settings.title,
    robots: { index: false, follow: false },
}));

export default async function Page({ params }: PageProps<"/[lang]/settings">) {
    const { lang, dict } = await localePage(params);
    const user = await getCurrentUser();

    if (!user) {
        redirect(signInPathWithReturn(lang, settingsPath(lang)));
    }

    return <SettingsScreen copy={dict.settings} locale={lang} user={user} />;
}
