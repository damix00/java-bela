import CheckEmailScreen from "@/components/pages/auth/sections/CheckEmailScreen";
import { localePage } from "@/dictionaries";
import { guardCredentialScreen } from "@/lib/session-guards";
import { localeMetadata } from "@/lib/metadata";

export const generateMetadata = localeMetadata(
  (dict) => dict.auth.checkEmail.title,
);

export default async function Page({
  params,
}: PageProps<"/[lang]/check-email">) {
  const { lang, dict } = await localePage(params);
  await guardCredentialScreen(lang);

  return <CheckEmailScreen copy={dict.auth.checkEmail} />;
}
