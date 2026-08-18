import SignInScreen from "@/components/pages/auth/sections/SignInScreen";
import { localePage } from "@/dictionaries";
import { localeMetadata } from "@/lib/metadata";

export const generateMetadata = localeMetadata(
  (dict) => dict.auth.signIn.title,
);

export default async function Page({ params }: PageProps<"/[lang]/sign-in">) {
  const { lang, dict } = await localePage(params);

  return (
    <SignInScreen
      copy={dict.auth.signIn}
      common={dict.auth.common}
      errors={dict.form.errors}
      locale={lang}
      standalone
    />
  );
}
