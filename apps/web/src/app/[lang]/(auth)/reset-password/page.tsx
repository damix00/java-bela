import ResetPasswordScreen from "@/components/pages/auth/sections/ResetPasswordScreen";
import { localePage } from "@/dictionaries";
import { localeMetadata } from "@/lib/metadata";

export const generateMetadata = localeMetadata((dict) => dict.auth.reset.title);

export default async function Page({
  params,
}: PageProps<"/[lang]/reset-password">) {
  const { dict } = await localePage(params);

  return (
    <ResetPasswordScreen
      copy={dict.auth.reset}
      common={dict.auth.common}
      errors={dict.form.errors}
    />
  );
}
