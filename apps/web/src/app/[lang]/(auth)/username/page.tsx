import ChooseUsernameScreen from "@/components/pages/auth/sections/ChooseUsernameScreen";
import { localePage } from "@/dictionaries";
import { localeMetadata } from "@/lib/metadata";

export const generateMetadata = localeMetadata(
    (dict) => dict.auth.username.title,
);

export default async function Page({ params }: PageProps<"/[lang]/username">) {
    const { dict } = await localePage(params);

    return (
        <ChooseUsernameScreen
            copy={dict.auth.username}
            common={dict.auth.common}
            errors={dict.form.errors}
        />
    );
}
