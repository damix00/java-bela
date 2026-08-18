import SignUpScreen from "@/components/pages/auth/sections/SignUpScreen";
import { localePage } from "@/dictionaries";
import { localeMetadata } from "@/lib/metadata";

export const generateMetadata = localeMetadata(
  (dict) => dict.auth.signUp.title,
);

export default async function Page({ params }: PageProps<"/[lang]/sign-up">) {
  const { lang, dict } = await localePage(params);

  return (
    <SignUpScreen
      copy={dict.auth.signUp}
      common={dict.auth.common}
      form={dict.form}
      locale={lang}
      standalone
    />
  );
}
