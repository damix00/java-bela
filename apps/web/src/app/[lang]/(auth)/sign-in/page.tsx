import SignInScreen from "@/components/pages/auth/sections/SignInScreen";
import { localePage } from "@/dictionaries";
import { localeMetadata } from "@/lib/metadata";
import { readReturnTo } from "@/lib/routes";
import { guardCredentialScreen } from "@/lib/session-guards";

export const generateMetadata = localeMetadata(
  (dict) => dict.auth.signIn.title,
);

export default async function Page({
  params,
  searchParams,
}: PageProps<"/[lang]/sign-in">) {
  const { lang, dict } = await localePage(params);
  const returnTo = readReturnTo(await searchParams, lang);
  const user = await guardCredentialScreen(lang, returnTo);

  return (
    <SignInScreen
      copy={dict.auth.signIn}
      common={dict.auth.common}
      errors={dict.form.errors}
      locale={lang}
      standalone
      showGuest={user === null}
      returnTo={returnTo}
    />
  );
}
