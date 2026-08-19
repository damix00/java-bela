import WelcomeScreen from "@/components/pages/auth/sections/WelcomeScreen";
import { localePage } from "@/dictionaries";
import { localeMetadata } from "@/lib/metadata";

export const generateMetadata = localeMetadata(
    (dict) => dict.auth.welcome.title,
);

export default async function Page({ params }: PageProps<"/[lang]/welcome">) {
    const { dict } = await localePage(params);

    return <WelcomeScreen copy={dict.auth.welcome} />;
}
