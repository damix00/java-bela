import TwoFactorScreen from "@/components/pages/auth/sections/TwoFactorScreen";
import { localePage } from "@/dictionaries";
import { localeMetadata } from "@/lib/metadata";

export const generateMetadata = localeMetadata(
  (dict) => dict.auth.twoFactor.title,
);

export default async function Page({
  params,
}: PageProps<"/[lang]/two-factor">) {
  const { lang, dict } = await localePage(params);

  return (
    <TwoFactorScreen
      copy={dict.auth.twoFactor}
      common={dict.auth.common}
      errors={dict.form.errors}
      locale={lang}
    />
  );
}
