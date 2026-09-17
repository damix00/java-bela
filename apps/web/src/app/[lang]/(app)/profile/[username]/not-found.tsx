import ProfileNotFoundScreen from "@/components/pages/profile/sections/ProfileNotFoundScreen";
import en from "@/dictionaries/en.json";
import hr from "@/dictionaries/hr.json";

export default function NotFound() {
    return (
        <ProfileNotFoundScreen
            copy={{
                en: en.profile.notFound,
                hr: hr.profile.notFound,
            }}
        />
    );
}
